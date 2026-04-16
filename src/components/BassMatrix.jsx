import { useCallback, useState } from 'react';
import useMusicStore from '../store/useMusicStore';
import { BASS_NOTES, BASS_COLUMNS, eighthToStep } from '../data/bassNotes';
import audioEngine from '../audio/AudioEngine';
import './BassMatrix.css';

/**
 * BassMatrix — Bass 音序矩阵编辑器
 *
 * 纵轴: B2 (顶) → C2 (底), 12 行半音阶
 * 横轴: 8 列八分音符位
 *
 * 交互:
 *   - 点击/触摸 → 切换音符开/关
 *   - C 大调音阶行高亮背景
 *   - 点亮格使用冰蓝发光
 */
const CHORD_TO_BASS_GUIDE = {
  'C': 'C2',
  'Am': 'A2',
  'F': 'F2',
  'G': 'G2',
  // Transitions
  'Em/B': 'B2',
  'G7': 'G2',
  'G/B': 'B2',
  'E7': 'E2',
  'Fm': 'F2',
  'C/E': 'E2',
  'Abdim': 'Ab2',
  'D/F#': 'Gb2',
};

export default function BassMatrix() {
  const selectedBar = useMusicStore((s) => s.selectedBar);
  const totalBars = useMusicStore((s) => s.totalBars);
  const matrix = useMusicStore((s) => s.matrix);
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const toggleBassNote = useMusicStore((s) => s.toggleBassNote);
  const setSelectedBar = useMusicStore((s) => s.setSelectedBar);
  const autoFillBassFromChord = useMusicStore((s) => s.autoFillBassFromChord);

  const [ripples, setRipples] = useState([]);
  const [fillFlash, setFillFlash] = useState(false);

  /** 一键匹配和弦进行 */
  const handleAutoFill = useCallback(() => {
    autoFillBassFromChord(selectedBar);
    setFillFlash(true);
    setTimeout(() => setFillFlash(false), 900);
  }, [autoFillBassFromChord, selectedBar]);

  /**
   * 点击/触摸 → 切换音符 + 播放预览
   */
  const handleCellTouchStart = useCallback(
    async (e, eighthIndex, note) => {
      e.preventDefault();
      
      const rId = Date.now() + Math.random();
      setRipples(prev => [...prev, { id: rId, eighthIndex, note }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rId)), 500);

      toggleBassNote(selectedBar, eighthIndex, note);

      // 检查是否新写入（切换后刚点亮）
      const stepIndex = eighthToStep(eighthIndex);
      const cell = matrix.bass[selectedBar][stepIndex];
      // 如果之前没有，说明现在写入了，播放预览
      if (!cell || cell.note !== note) {
        await audioEngine.playBassPreview(note);
      }
    },
    [selectedBar, toggleBassNote, matrix]
  );

  // 当前 bar 数据
  const barData = matrix.bass[selectedBar];
  const chordTrackData = matrix.chord[selectedBar];

  return (
    <div className="bass-matrix" id="bass-matrix">
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
        {/* 一键匹配和弦进行 */}
        <button
          id="bass-auto-fill-btn"
          className={`bass-auto-fill-btn ${fillFlash ? 'flash' : ''}`}
          onClick={handleAutoFill}
          onTouchStart={handleAutoFill}
          title="根据和弦轨自动在第1、3、5、7位写入根音"
        >
          {fillFlash ? '✓ 已匹配' : '⚡ 匹配和弦'}
        </button>
      </div>

      {/* 矩阵网格 */}
      <div className="bass-grid">
        {/* 列标题 (八分音符位) */}
        <div className="bass-grid-header">
          <div className="bass-note-label-spacer" />
          {Array.from({ length: BASS_COLUMNS }, (_, colIdx) => {
            const stepIdx = eighthToStep(colIdx);
            const isCurrent =
              isPlaying &&
              selectedBar === currentBar &&
              (currentStep === stepIdx || currentStep === stepIdx + 1);

            return (
              <div
                key={colIdx}
                className={`bass-col-header ${isCurrent ? 'active' : ''}`}
              >
                {colIdx + 1}
              </div>
            );
          })}
        </div>

        {/* Scrolling container for rows to freeze headers */}
        <div className="bass-rows-container">
          {/* 12 行 (B2 → C2) */}
          {BASS_NOTES.map(({ note, label, inScale }) => (
            <div
              key={note}
              className={`bass-row ${inScale ? 'in-scale' : 'chromatic'}`}
            >
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

                // 引导逻辑：与 chord 轨实时同步
                const currentChordId = chordTrackData[stepIdx]?.chordId;
                const guideNote = currentChordId ? CHORD_TO_BASS_GUIDE[currentChordId] : null;
                const isGuide = guideNote === note && !isActive; // 没被点亮时才显示引导边缘闪烁

                return (
                  <div
                    key={colIdx}
                    className={`bass-cell ${isActive ? 'lit' : ''} ${isCurrent ? 'cursor' : ''} ${isCurrent && isActive ? 'lit-cursor' : ''} ${isGuide ? 'guide-blink' : ''}`}
                    onTouchStart={(e) => handleCellTouchStart(e, colIdx, note)}
                    onClick={async () => {
                      const rId = Date.now() + Math.random();
                      setRipples(prev => [...prev, { id: rId, eighthIndex: colIdx, note }]);
                      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rId)), 500);
                      
                      toggleBassNote(selectedBar, colIdx, note);
                      const s = eighthToStep(colIdx);
                      const c = matrix.bass[selectedBar][s];
                      if (!c || c.note !== note) {
                        await audioEngine.playBassPreview(note);
                      }
                    }}
                    data-note={note}
                    data-col={colIdx}
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
