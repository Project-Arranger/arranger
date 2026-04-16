import { useState, useCallback, useRef } from 'react';
import useMusicStore from '../store/useMusicStore';
import { showDragGhost, moveDragGhost, hideDragGhost } from '../utils/dragGhost';
import './TrackRow.css';

const BEATS_PER_BAR = 4;
const STEPS_PER_BEAT = 4; // 16 steps / 4 beats

/**
 * TrackRow — Bass / Perc / Lead overview row
 * Steps grouped into beat-level units for beat-precise seek targeting
 * Now supports drag-down to delete active notes
 */
export default function TrackRow({ trackId, Icon, label, onClick }) {
  const totalBars = useMusicStore((s) => s.totalBars);
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const matrix = useMusicStore((s) => s.matrix);
  const activeContextTrack = useMusicStore((s) => s.activeContextTrack);
  const seekBar = useMusicStore((s) => s.seekBar);
  const seekBeat = useMusicStore((s) => s.seekBeat);
  const clearStep = useMusicStore((s) => s.clearStep);

  const [internalDrag, setInternalDrag] = useState(null);
  const internalDragRef = useRef(null);

  const isActive = activeContextTrack === trackId;

  const handleStepPointerDown = useCallback((e, barIdx, stepIdx, cell) => {
    if (!cell) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);

    const labelStr = trackId === 'perc' 
      ? (cell.instruments?.[0] || 'perc') 
      : (cell.note || label);

    const dragState = {
      barIdx,
      stepIdx,
      label: labelStr,
      overDelete: false,
      didMove: false
    };
    
    internalDragRef.current = dragState;
    setInternalDrag(dragState);

    // Communicate to MainComposerView to show global delete zone
    window.dispatchEvent(new CustomEvent('drag-active-start'));

    showDragGhost({
      label: labelStr,
      color: '#fff', 
      clientX: e.clientX,
      clientY: e.clientY
    });

    let rafId = null;
    const onPointerMove = (ev) => {
      moveDragGhost(ev.clientX, ev.clientY);

      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const d = internalDragRef.current;
        if (!d) return;
        d.didMove = true;

        const deleteZone = document.getElementById('global-arrangement-delete-zone');
        let overDelete = false;
        if (deleteZone) {
          const rect = deleteZone.getBoundingClientRect();
          overDelete = 
            ev.clientX >= rect.left && ev.clientX <= rect.right &&
            ev.clientY >= rect.top && ev.clientY <= rect.bottom;
        }

        if (d.overDelete !== overDelete) {
          d.overDelete = overDelete;
          setInternalDrag({ ...d });
          // Notify global zone to highlight
          window.dispatchEvent(new CustomEvent('drag-over-delete', { detail: { over: overDelete } }));
        }
      });
    };

    const onPointerUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      
      hideDragGhost();
      window.dispatchEvent(new CustomEvent('drag-active-end'));

      const d = internalDragRef.current;
      if (d && d.didMove && d.overDelete) {
        clearStep(trackId, d.barIdx, d.stepIdx);
      }
      
      internalDragRef.current = null;
      setInternalDrag(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [trackId, label, clearStep]);

  return (
    <div
      className={`track-row track-row-${trackId} ${isActive ? 'active-track' : ''}`}
      id={`track-${trackId}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', position: 'relative' }}
    >
      <div className="track-label">
        <span className="track-label-icon">{Icon && <Icon active={isActive} />}</span>
        <span className="track-label-text">{label}</span>
      </div>
      <div className="track-row-grid">
        {Array.from({ length: totalBars }, (_, barIdx) => (
          <div
            key={barIdx}
            data-bar={barIdx}
            className={`track-row-bar ${barIdx === currentBar && isPlaying ? 'current' : ''}`}
          >
            {Array.from({ length: BEATS_PER_BAR }, (_, beatIdx) => {
              const isSeekBeat = barIdx === seekBar && beatIdx === seekBeat;
              return (
                <div
                  key={beatIdx}
                  data-beat={beatIdx}
                  className={`track-row-beat ${isSeekBeat ? 'seek-beat' : ''}`}
                >
                  {Array.from({ length: STEPS_PER_BEAT }, (_, subIdx) => {
                    const stepIdx = beatIdx * STEPS_PER_BEAT + subIdx;
                    const cell = matrix[trackId]?.[barIdx]?.[stepIdx];
                    const isCurrent =
                      isPlaying &&
                      barIdx === currentBar &&
                      stepIdx === currentStep;
                    const isDragging = internalDrag && 
                                     internalDrag.barIdx === barIdx && 
                                     internalDrag.stepIdx === stepIdx;
                                     
                    return (
                      <div
                        key={stepIdx}
                        className={`track-row-step ${cell ? 'filled' : ''} ${isCurrent ? 'active' : ''} ${stepIdx % 4 === 0 ? 'beat-start' : ''} ${isDragging ? 'dragging' : ''}`}
                        onPointerDown={(e) => handleStepPointerDown(e, barIdx, stepIdx, cell)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Local delete zones removed — using global-arrangement-delete-zone */}
    </div>
  );
}
