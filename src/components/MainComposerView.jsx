import { useCallback, useEffect, useRef, useState } from 'react';
import useMusicStore from '../store/useMusicStore';
import audioEngine from '../audio/AudioEngine';
import TransportBar from './TransportBar';
import ChordTrack from './ChordTrack';
import TrackRow from './TrackRow';
import ContextArea from './ContextArea';
import { BassIcon, ChordIcon, PercIcon, LeadIcon } from './Icons';
import { getEditorTrackLabel } from '../domain/editorTracks';
import './MainComposerView.css';

const TRACK_SOURCES = [
  { id: 'perc', label: 'Drums', Icon: PercIcon },
  { id: 'bass', label: 'Bass', Icon: BassIcon },
  { id: 'chord', label: 'Chord', Icon: ChordIcon },
  { id: 'lead', label: 'Lead', Icon: LeadIcon },
];

function TrackSourceRow({ track, isActive, onSelect, onAdd }) {
  const { Icon } = track;

  return (
    <div className={`track-source-row track-source-row-${track.id} ${isActive ? 'active' : ''}`}>
      <button
        type="button"
        className="track-source-main"
        onClick={onSelect}
      >
        <span className="track-source-icon">
          <Icon active={isActive} />
        </span>
        <span className="track-source-label">{track.label}</span>
      </button>
      <button
        type="button"
        className="track-add-editor-btn"
        aria-label={`Add ${track.label.toUpperCase()} to arrangement`}
        title={`添加 ${track.label} 到右侧音轨区`}
        onClick={onAdd}
      >
        +
      </button>
    </div>
  );
}

/**
 * MainComposerView — 主编曲视图容器
 */
export default function MainComposerView() {
  const [arrangementHeight, setArrangementHeight] = useState(360);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [dragChordId, setDragChordId] = useState(null);
  const [dragOverDelete, setDragOverDelete] = useState(false);
  const resizeStartRef = useRef(null);
  const activeContextTrack = useMusicStore((s) => s.activeContextTrack);
  const editorTrackStack = useMusicStore((s) => s.editorTrackStack);
  const activeEditorTrackEntryId = useMusicStore((s) => s.activeEditorTrackEntryId);
  const setActiveContextTrack = useMusicStore((s) => s.setActiveContextTrack);
  const addEditorTrack = useMusicStore((s) => s.addEditorTrack);
  const removeEditorTrack = useMusicStore((s) => s.removeEditorTrack);
  const setActiveEditorTrackEntry = useMusicStore((s) => s.setActiveEditorTrackEntry);
  const setSelectedBar = useMusicStore((s) => s.setSelectedBar);
  const setSeekPosition = useMusicStore((s) => s.setSeekPosition);
  const totalBars = useMusicStore((s) => s.totalBars);
  const seekBar = useMusicStore((s) => s.seekBar);
  const seekBeat = useMusicStore((s) => s.seekBeat);

  useEffect(() => {
    const handleChordDragStart = (e) => {
      setDragChordId(e.detail.chordId);
      setIsDraggingAny(true);
    };
    const handleDragActiveStart = () => setIsDraggingAny(true);
    const handleDragEnd = () => {
      setDragChordId(null);
      setIsDraggingAny(false);
      setDragOverDelete(false);
    };
    const handleOverDelete = (e) => setDragOverDelete(e.detail.over);

    window.addEventListener('chord-drag-start', handleChordDragStart);
    window.addEventListener('chord-drag-end', handleDragEnd);
    window.addEventListener('drag-active-start', handleDragActiveStart);
    window.addEventListener('drag-active-end', handleDragEnd);
    window.addEventListener('drag-over-delete', handleOverDelete);

    return () => {
      window.removeEventListener('chord-drag-start', handleChordDragStart);
      window.removeEventListener('chord-drag-end', handleDragEnd);
      window.removeEventListener('drag-active-start', handleDragActiveStart);
      window.removeEventListener('drag-active-end', handleDragEnd);
      window.removeEventListener('drag-over-delete', handleOverDelete);
    };
  }, []);

  const handleTrackClick = useCallback(
    (trackId) => setActiveContextTrack(trackId),
    [setActiveContextTrack]
  );

  const handleAddEditorTrack = useCallback(
    (trackId) => addEditorTrack(trackId),
    [addEditorTrack]
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

  const handleResizePointerDown = useCallback((e) => {
    e.preventDefault();

    const startY = e.clientY;
    const startHeight = arrangementHeight;
    resizeStartRef.current = { startY, startHeight };

    const handlePointerMove = (moveEvent) => {
      const viewportMax = Math.max(260, window.innerHeight - 220);
      const nextHeight = Math.min(
        viewportMax,
        Math.max(220, startHeight + moveEvent.clientY - startY)
      );
      setArrangementHeight(nextHeight);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      resizeStartRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [arrangementHeight]);

  const renderEditorTrackGrid = useCallback((entry) => {
    const source = TRACK_SOURCES.find(track => track.id === entry.trackId);

    if (entry.trackId === 'chord') {
      return (
        <div className={`editor-track-grid-surface editor-track-grid-surface-filled editor-track-grid-surface-${entry.trackId}`}>
          <ChordTrack
            dragChordId={dragChordId}
            onClick={() => setActiveEditorTrackEntry(entry.id)}
          />
        </div>
      );
    }

    return (
      <div className={`editor-track-grid-surface editor-track-grid-surface-filled editor-track-grid-surface-${entry.trackId}`}>
        <TrackRow
          trackId={entry.trackId}
          Icon={source?.Icon}
          label={source?.label?.toUpperCase() ?? entry.trackId.toUpperCase()}
          onClick={() => setActiveEditorTrackEntry(entry.id)}
        />
      </div>
    );
  }, [dragChordId, setActiveEditorTrackEntry]);

  return (
    <div className="main-composer" id="main-composer-view">
      <TransportBar />

      <div
        className="arrangement-section"
        id="arrangement-section"
        onClick={handleOverviewClick}
        style={{ '--arrangement-height': `${arrangementHeight}px` }}
      >
        <div className="timeline-ruler" aria-label="Arrangement timeline ruler">
          <div className="timeline-sidebar">
            <span>TRACKS</span>
            <button type="button" className="timeline-edit-btn" aria-label="Edit tracks">✎</button>
          </div>
          <div className="ruler-strip">
            <div className="editor-track-prebar-ruler" aria-hidden="true" />
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
        </div>

        <div
          className="track-overview track-arranger custom-scrollbar"
          id="track-overview"
          style={{
            '--playhead-position': `${((seekBar + seekBeat / 4) / totalBars) * 100}%`,
          }}
        >
          <div className="arrangement-playhead" />
          <div className="track-source-list">
            {TRACK_SOURCES.map((track) => (
              <TrackSourceRow
                key={track.id}
                track={track}
                isActive={activeContextTrack === track.id}
                onSelect={() => handleTrackClick(track.id)}
                onAdd={(e) => {
                  e?.stopPropagation?.();
                  handleAddEditorTrack(track.id);
                }}
              />
            ))}
            <button
              type="button"
              className="source-add-track-row"
              aria-label="Add Track"
              title="Add Track"
            >
              <span>+</span>
              <span>Track</span>
            </button>
          </div>

          <div className="editor-track-lanes">
            {editorTrackStack.length === 0 ? (
              <div className="editor-track-empty-state">
                <div className="editor-track-prebar editor-track-prebar-empty" aria-hidden="true" />
                <div className="editor-track-empty-grid">
                  点击左侧 + 添加音轨。
                </div>
              </div>
            ) : (
              editorTrackStack.map((entry) => (
                <div
                  key={entry.id}
                  className={`editor-track-lane ${entry.id === activeEditorTrackEntryId ? 'active' : ''}`}
                  data-editor-track-id={entry.id}
                >
                  <div
                    className="editor-track-prebar"
                  >
                    <button
                      type="button"
                      className="editor-track-phrase"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEditorTrackEntry(entry.id);
                      }}
                    >
                      {getEditorTrackLabel(entry)}
                    </button>
                    <button
                      type="button"
                      className="track-remove-editor-btn"
                      aria-label={`Remove ${getEditorTrackLabel(entry)} from arrangement`}
                      title={`删除 ${getEditorTrackLabel(entry)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEditorTrack(entry.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="editor-track-bar-grid">
                    {renderEditorTrackGrid(entry)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div
        className="split-resize-handle"
        role="separator"
        aria-label="Resize track editor split"
        aria-orientation="horizontal"
        tabIndex={0}
        onPointerDown={handleResizePointerDown}
      >
        <span />
      </div>

      {isDraggingAny && (
        <div
          id="global-arrangement-delete-zone"
          className={`global-delete-zone ${dragOverDelete ? 'active' : ''}`}
        >
          <span className="delete-icon">⌫</span>
          <span>拖到此处删除</span>
        </div>
      )}

      <ContextArea />
    </div>
  );
}
