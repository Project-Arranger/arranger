import { useState, useCallback, useEffect, useRef } from 'react';
import useMusicStore from '../store/useMusicStore';
import audioEngine from '../audio/AudioEngine';
import TransportBar from './TransportBar';
import ChordTrack from './ChordTrack';
import TrackRow from './TrackRow';
import ContextArea from './ContextArea';
import { BassIcon, PercIcon, LeadIcon } from './Icons';
import './MainComposerView.css';

/**
 * MainComposerView — 主编曲视图容器
 *
 * Ghost drag is fully handled by dragGhost.js (no React state).
 * dragChordId is only used to highlight drop zones in ChordTrack.
 */
export default function MainComposerView() {
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [dragChordId, setDragChordId] = useState(null);
  const [dragOverDelete, setDragOverDelete] = useState(false);
  const setActiveContextTrack = useMusicStore((s) => s.setActiveContextTrack);
  const setSeekPosition = useMusicStore((s) => s.setSeekPosition);
  const trackOverviewRef = useRef(null);

  useEffect(() => {
    const onDragStart = (e) => {
      setDragChordId(e.detail.chordId);
      setIsDraggingAny(true);
    };
    const onDragEnd = () => {
      setDragChordId(null);
      setIsDraggingAny(false);
      setDragOverDelete(false);
    };

    // Listen for 'over-delete' signals from individual tracks
    const onOverDelete = (e) => setDragOverDelete(e.detail.over);

    window.addEventListener('chord-drag-start', onDragStart);
    window.addEventListener('chord-drag-end',   onDragEnd);
    window.addEventListener('drag-active-start', () => setIsDraggingAny(true));
    window.addEventListener('drag-active-end',   onDragEnd);
    window.addEventListener('drag-over-delete', onOverDelete);

    return () => {
      window.removeEventListener('chord-drag-start', onDragStart);
      window.removeEventListener('chord-drag-end',   onDragEnd);
      window.removeEventListener('drag-active-start', () => setIsDraggingAny(true));
      window.removeEventListener('drag-active-end',   onDragEnd);
      window.removeEventListener('drag-over-delete', onOverDelete);
    };
  }, []);

  const handleTrackClick = useCallback(
    (trackId) => setActiveContextTrack(trackId),
    [setActiveContextTrack]
  );

  const handleOverviewClick = useCallback((e) => {
    const barEl = e.target.closest('[data-bar]');
    if (!barEl) return;

    const barIndex = parseInt(barEl.dataset.bar, 10);
    if (isNaN(barIndex)) return;

    const beatEl = e.target.closest('[data-beat]');
    let beatIndex = 0;
    if (beatEl && beatEl.dataset.beat !== undefined) {
      beatIndex = parseInt(beatEl.dataset.beat, 10);
    } else {
      const rect = barEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      beatIndex = Math.min(3, Math.floor(x * 4));
    }

    setSeekPosition(barIndex, beatIndex);
    audioEngine.seekToStep(barIndex, beatIndex * 4);
  }, [setSeekPosition]);

  return (
    <div className="main-composer" id="main-composer-view">
      <TransportBar />

      <div
        className="track-overview"
        id="track-overview"
        ref={trackOverviewRef}
        onClick={handleOverviewClick}
        style={{ position: 'relative' }}
      >
        <ChordTrack
          dragChordId={dragChordId}
          onClick={() => handleTrackClick('chord')}
        />
        <TrackRow trackId="bass" Icon={BassIcon} label="BASS" onClick={() => handleTrackClick('bass')} />
        <TrackRow trackId="perc" Icon={PercIcon} label="PERC" onClick={() => handleTrackClick('perc')} />
        <TrackRow trackId="lead" Icon={LeadIcon} label="LEAD" onClick={() => handleTrackClick('lead')} />
        
        {/* Unified Global Delete Zone */}
        {isDraggingAny && (
          <div
            id="global-arrangement-delete-zone"
            className={`global-delete-zone ${dragOverDelete ? 'active' : ''}`}
          >
            <span className="delete-icon">🗑</span>
            <span>拖到此处删除</span>
          </div>
        )}
      </div>

      <ContextArea />
      {/* Ghost is rendered by dragGhost.js directly on document.body — no React involved */}
    </div>
  );
}
