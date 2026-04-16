import { useCallback, useEffect, useRef, useState } from 'react';
import useMusicStore from '../store/useMusicStore';
import { BASS_NOTES, BASS_COLUMNS, eighthToStep } from '../data/bassNotes';
import audioEngine from '../audio/AudioEngine';
import './BassMatrix.css'; // Reuse Bass styling

/**
 * LeadMatrix — Lead 旋律编辑器
 * 规格: 12 行 x 8 列
 */

// Mapping C-B but in Octave 4 for lead
const LEAD_NOTES = BASS_NOTES.map(n => ({
    ...n,
    note: n.note.replace('2', '4'),
    label: n.label // Keep same labels C, C#, etc.
}));

/** 键盘 1-7 → C D E F G A B (Octave 4) */
const KEY_TO_NOTE = {
  '1': 'C4',
  '2': 'D4',
  '3': 'E4',
  '4': 'F4',
  '5': 'G4',
  '6': 'A4',
  '7': 'B4',
};

export default function LeadMatrix() {
  const selectedBar = useMusicStore((s) => s.selectedBar);
  const totalBars = useMusicStore((s) => s.totalBars);
  const matrix = useMusicStore((s) => s.matrix);
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const toggleLeadNote = useMusicStore((s) => s.toggleLeadNote);
  const setSelectedBar = useMusicStore((s) => s.setSelectedBar);

  const [ripples, setRipples] = useState([]);
  // Track held keys using a ref (no re-render needed)
  const heldKeysRef = useRef(new Set());

  /**
   * 键盘 1-7 快捷键：对应 C4–B4
   * 仅发声预览，不写入网格
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const note = KEY_TO_NOTE[e.key];
      if (!note) return;
      if (heldKeysRef.current.has(e.key)) return; // prevent key-repeat
      
      heldKeysRef.current.add(e.key);
      audioEngine.playLeadPreview(note);
    };

    const handleKeyUp = (e) => {
      heldKeysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // mount/unmount only



  const handleCellTouchStart = useCallback(
    async (e, eighthIndex, note) => {
      e.preventDefault();
      
      const rId = Date.now() + Math.random();
      setRipples(prev => [...prev, { id: rId, eighthIndex, note }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rId)), 500);

      toggleLeadNote(selectedBar, eighthIndex, note);

      const stepIndex = eighthToStep(eighthIndex);
      const cell = matrix.lead[selectedBar][stepIndex];
      if (!cell || cell.note !== note) {
        await audioEngine.playLeadPreview(note);
      }
    },
    [selectedBar, toggleLeadNote, matrix]
  );

  const barData = matrix.lead[selectedBar];

  return (
    <div className="bass-matrix" id="lead-matrix"> {/* Reusing bass-matrix class for same layout */}
      {/* 小节选择器 */}
      <div className="bass-bar-selector">
        <span className="bass-bar-label">BAR</span>
        <div className="bass-bar-tabs">
          {Array.from({ length: totalBars }, (_, i) => (
            <button
              key={i}
              className={`bass-bar-tab ${i === selectedBar ? 'active' : ''} ${i === currentBar && isPlaying ? 'playing' : ''}`}
              onTouchStart={() => setSelectedBar(i)}
              onClick={() => setSelectedBar(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 矩阵网格 */}
      <div className="bass-grid">
        <div className="bass-grid-header">
          <div className="bass-note-label-spacer" />
          {Array.from({ length: BASS_COLUMNS }, (_, colIdx) => {
            const stepIdx = eighthToStep(colIdx);
            const isCurrent =
              isPlaying &&
              selectedBar === currentBar &&
              (currentStep === stepIdx || currentStep === stepIdx + 1);

            return (
              <div key={colIdx} className={`bass-col-header ${isCurrent ? 'active' : ''}`}>
                {colIdx + 1}
              </div>
            );
          })}
        </div>

        {/* Scrolling container for rows to freeze headers */}
        <div className="bass-rows-container">
          {LEAD_NOTES.map(({ note, label, inScale }) => (
            <div key={note} className={`bass-row ${inScale ? 'in-scale' : 'chromatic'}`}>
              <div className={`bass-note-label ${inScale ? 'in-scale' : ''}`}>
                {label}
              </div>
              {Array.from({ length: BASS_COLUMNS }, (_, colIdx) => {
                const stepIdx = eighthToStep(colIdx);
                const cell = barData[stepIdx];
                const isActive = cell && cell.note === note;
                const isCurrent =
                  isPlaying &&
                  selectedBar === currentBar &&
                  (currentStep === stepIdx || currentStep === stepIdx + 1);

                return (
                  <div
                    key={colIdx}
                    className={`bass-cell ${isActive ? 'lit' : ''} ${isCurrent ? 'cursor' : ''} ${isCurrent && isActive ? 'lit-cursor' : ''}`}
                    onTouchStart={(e) => handleCellTouchStart(e, colIdx, note)}
                    onClick={async () => {
                      const rId = Date.now() + Math.random();
                      setRipples(prev => [...prev, { id: rId, eighthIndex: colIdx, note }]);
                      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rId)), 500);
                      
                      toggleLeadNote(selectedBar, colIdx, note);
                      if (!isActive) {
                        await audioEngine.playLeadPreview(note);
                      }
                    }}
                  >
                    {ripples.map(r => r.eighthIndex === colIdx && r.note === note && (
                      <span key={r.id} className="cell-ripple" />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
