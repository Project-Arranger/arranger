import { useCallback, useState } from 'react';
import useMusicStore from '../store/useMusicStore';
import { PERC_INSTRUMENTS, PERC_COLUMNS } from '../data/percNotes';
import { eighthToStep } from '../data/bassNotes'; // reuse eighth mapping
import audioEngine from '../audio/AudioEngine';
import { KickIcon, SnareIcon, HihatIcon, TomIcon, ClapIcon } from './Icons';
import './PercMatrix.css';

const ICON_MAP = {
  kick: KickIcon,
  snare: SnareIcon,
  hihat: HihatIcon,
  tom: TomIcon,
  clap: ClapIcon
};

/**
 * PercMatrix — 打击乐音序矩阵编辑器
 *
 * 纵轴: Hi-hat, Clap, Snare, Tom, Kick
 * 横轴: 8 列八分音符位
 *
 * 交互:
 *   - 点击/触摸 → 切换音符开/关 + 触发 one-shot
 *   - 点亮格使用冰蓝发光
 */
export default function PercMatrix() {
  const selectedBar = useMusicStore((s) => s.selectedBar);
  const totalBars = useMusicStore((s) => s.totalBars);
  const matrix = useMusicStore((s) => s.matrix);
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const togglePercNote = useMusicStore((s) => s.togglePercNote);
  const setSelectedBar = useMusicStore((s) => s.setSelectedBar);

  const [ripples, setRipples] = useState([]);

  const handleCellTouchStart = useCallback(
    async (e, eighthIndex, instrumentId) => {
      e.preventDefault();

      const rId = Date.now() + Math.random();
      setRipples(prev => [...prev, { id: rId, eighthIndex, instrumentId }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rId)), 500);

      togglePercNote(selectedBar, eighthIndex, instrumentId);

      // Play instrument instantly on interaction
      const stepIndex = eighthToStep(eighthIndex);
      const cell = matrix.perc[selectedBar][stepIndex];
      // Note: toggle happens instantly in state, but may not be reflected in closure.
      // Easiest is to play preview if we just turned it ON. Let's just play it always or check properly!
      // To check properly, if the cell didn't have it, we just turned it on.
      const hasInst = cell?.instruments?.includes(instrumentId);
      if (!hasInst) {
        await audioEngine.playPercPreview(instrumentId);
      }
    },
    [selectedBar, togglePercNote, matrix]
  );

  // 当前 bar 数据
  const barData = matrix.perc[selectedBar];

  return (
    <div className="perc-matrix" id="perc-matrix">
      {/* 小节选择器 */}
      <div className="perc-bar-selector">
        <span className="perc-bar-label">BAR</span>
        <div className="perc-bar-tabs">
          {Array.from({ length: totalBars }, (_, i) => (
            <button
              key={i}
              className={`perc-bar-tab ${i === selectedBar ? 'active' : ''} ${i === currentBar && isPlaying ? 'playing' : ''}`}
              onTouchStart={() => setSelectedBar(i)}
              onClick={() => setSelectedBar(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 矩阵网格 */}
      <div className="perc-grid">
        {/* 列标题 */}
        <div className="perc-grid-header">
          <div className="perc-inst-label-spacer" />
          {Array.from({ length: PERC_COLUMNS }, (_, colIdx) => {
            const stepIdx = eighthToStep(colIdx);
            const isCurrent =
              isPlaying &&
              selectedBar === currentBar &&
              (currentStep === stepIdx || currentStep === stepIdx + 1);

            return (
              <div
                key={colIdx}
                className={`perc-col-header ${isCurrent ? 'active' : ''}`}
              >
                {colIdx + 1}
              </div>
            );
          })}
        </div>

        {/* 乐器行 */}
        {PERC_INSTRUMENTS.map(({ id, label, color }) => {
          const InstIcon = ICON_MAP[id];
          return (
          <div key={id} className="perc-row">
            <div className="perc-inst-label">
              {InstIcon && <span style={{ color: color, display: 'flex', alignItems: 'center' }}><InstIcon /></span>}
              <span>{label}</span>
            </div>
            {Array.from({ length: PERC_COLUMNS }, (_, colIdx) => {
              const stepIdx = eighthToStep(colIdx);
              const cell = barData[stepIdx];
              const isActive = cell?.instruments?.includes(id);
              const isCurrent =
                isPlaying &&
                selectedBar === currentBar &&
                (currentStep === stepIdx || currentStep === stepIdx + 1);

              return (
                <div
                  key={colIdx}
                  className={`perc-cell ${isActive ? 'lit' : ''} ${isCurrent ? 'cursor' : ''} ${isCurrent && isActive ? 'lit-cursor' : ''}`}
                  style={{ '--inst-color': color }}
                  onTouchStart={(e) => handleCellTouchStart(e, colIdx, id)}
                  onClick={async () => {
                    const rId = Date.now() + Math.random();
                    setRipples(prev => [...prev, { id: rId, eighthIndex: colIdx, instrumentId: id }]);
                    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rId)), 500);

                    togglePercNote(selectedBar, colIdx, id);
                    const hasInst = cell?.instruments?.includes(id);
                    if (!hasInst) {
                      await audioEngine.playPercPreview(id);
                    }
                  }}
                  data-instrument={id}
                  data-col={colIdx}
                >
                  {ripples.map(r => r.eighthIndex === colIdx && r.instrumentId === id && (
                    <span key={r.id} className="cell-ripple" />
                  ))}
                </div>
              );
            })}
          </div>
          );
        })}
      </div>
    </div>
  );
}
