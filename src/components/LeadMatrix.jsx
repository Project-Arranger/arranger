import { useCallback, useState } from 'react';
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
  );
}
