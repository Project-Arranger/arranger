import { useState, useCallback, useEffect } from 'react';
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
  const setSelectedBar = useMusicStore((s) => s.setSelectedBar);
  const setSeekPosition = useMusicStore((s) => s.setSeekPosition);
  const totalBars = useMusicStore((s) => s.totalBars);
  const seekBar = useMusicStore((s) => s.seekBar);
  const seekBeat = useMusicStore((s) => s.seekBeat);

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
    setSelectedBar(barIndex);
    audioEngine.seekToStep(barIndex, beatIndex * 4);
  }, [setSeekPosition, setSelectedBar]);

  return (
    <div className="main-composer" id="main-composer-view">
      <TransportBar />

      <div
        className="arrangement-section"
        id="arrangement-section"
        onClick={handleOverviewClick}
      >
        <div className="timeline-ruler" aria-label="Arrangement timeline ruler">
          <div className="timeline-sidebar">
            <span>TRACKS</span>
            <button type="button" className="timeline-edit-btn" aria-label="Edit tracks">✎</button>
          </div>
          <div className="ruler-strip">
            {Array.from({ length: totalBars }, (_, barIdx) => (
              <button
                type="button"
                key={barIdx}
                className="ruler-bar"
                data-bar={barIdx}
                data-beat="0"
              >
                {barIdx + 1}
              </button>
            ))}
          </div>
          <div className="timeline-controls-spacer" />
        </div>

        <div
          className="track-overview custom-scrollbar"
          id="track-overview"
          style={{
            '--playhead-position': `${((seekBar + seekBeat / 4) / totalBars) * 100}%`,
          }}
        >
          <div className="arrangement-playhead" />

          <TrackRow trackId="perc" Icon={PercIcon} label="DRUMS" onClick={() => handleTrackClick('perc')} />
          <TrackRow trackId="bass" Icon={BassIcon} label="BASS" onClick={() => handleTrackClick('bass')} />
          <ChordTrack
            dragChordId={dragChordId}
            onClick={() => handleTrackClick('chord')}
          />
          <TrackRow trackId="lead" Icon={LeadIcon} label="LEAD" onClick={() => handleTrackClick('lead')} />
        </div>
        
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
