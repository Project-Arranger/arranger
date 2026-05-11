import { useCallback, useState } from 'react';
import useMusicStore from '../store/useMusicStore';
import { PERC_INSTRUMENTS, PERC_COLUMNS } from '../data/percNotes';
import audioEngine from '../audio/AudioEngine';
import { KickIcon, SnareIcon, HihatIcon } from './Icons';
import './PercMatrix.css';

const ICON_MAP = {
  kick: KickIcon,
  snare: SnareIcon,
  hihat: HihatIcon,
};

/**
 * PercMatrix — 打击乐音序矩阵编辑器
 *
 * 纵轴: Kick, Snare, Hi-Hat
 * 横轴: 16 列十六分音符位
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
  const togglePercStep = useMusicStore((s) => s.togglePercStep);
  const autoFillPercGroove = useMusicStore((s) => s.autoFillPercGroove);
  const autoFillPercGrooveAll = useMusicStore((s) => s.autoFillPercGrooveAll);
  const setSelectedBar = useMusicStore((s) => s.setSelectedBar);

  const [ripples, setRipples] = useState([]);
  const [fillFlash, setFillFlash] = useState(false);

  /** 一键生成基础律动 */
  const handleAutoFill = useCallback(() => {
    const hasNotes = matrix.perc[selectedBar]?.some(Boolean);
    if (hasNotes && !window.confirm('将覆盖当前录入，确认生成基础律动吗？')) return;

    autoFillPercGroove(selectedBar);
    setFillFlash(true);
    setTimeout(() => setFillFlash(false), 900);
  }, [autoFillPercGroove, matrix, selectedBar]);

  const handleGlobalAutoFill = useCallback(() => {
    const hasNotes = matrix.perc.some(bar => bar.some(Boolean));
    if (hasNotes && !window.confirm('将覆盖全部小节的当前录入，确认生成基础律动吗？')) return;

    autoFillPercGrooveAll();
    setFillFlash(true);
    setTimeout(() => setFillFlash(false), 900);
  }, [autoFillPercGrooveAll, matrix]);

  const handlePreviousBar = useCallback(() => {
    setSelectedBar(Math.max(0, selectedBar - 1));
  }, [selectedBar, setSelectedBar]);

  const handleNextBar = useCallback(() => {
    setSelectedBar(Math.min(totalBars - 1, selectedBar + 1));
  }, [selectedBar, setSelectedBar, totalBars]);

  const handleCellPointerDown = useCallback(
    async (e, stepIndex, instrumentId) => {
      e.preventDefault();

      const rId = Date.now() + Math.random();
      setRipples(prev => [...prev, { id: rId, stepIndex, instrumentId }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rId)), 500);

      togglePercStep(selectedBar, stepIndex, instrumentId);

      // Play instrument instantly on interaction
      const cell = matrix.perc[selectedBar][stepIndex];
      const hasInst = cell?.instruments?.includes(instrumentId);
      if (!hasInst) {
        await audioEngine.playPercPreview(instrumentId);
      }
    },
    [selectedBar, togglePercStep, matrix]
  );

  // 当前 bar 数据
  const barData = matrix.perc[selectedBar];

  return (
    <div className="perc-matrix" id="perc-matrix">
      <div className="perc-toolbar">
        <div className="perc-toolbar-title">
          <span className="perc-title-icon">♪</span>
          <span>DRUM SEQUENCER - BAR {selectedBar + 1}</span>
        </div>
        <div className="perc-toolbar-actions">
          <button
            id="perc-auto-fill-btn"
            className={`perc-auto-fill-btn ${fillFlash ? 'flash' : ''}`}
            onClick={handleAutoFill}
          >
            {fillFlash ? '已生成' : '为本小节生成基础律动'}
          </button>
          <button
            className="perc-auto-fill-btn perc-auto-fill-global-btn"
            onClick={handleGlobalAutoFill}
          >
            全局生成基础律动
          </button>
        </div>
      </div>

      <div className="perc-grid">
        <div className="perc-stepper-shell">
          <div className="perc-inst-label-column">
            {PERC_INSTRUMENTS.map(({ id, label, color }) => {
              const InstIcon = ICON_MAP[id];
              return (
                <div key={id} className="perc-inst-label">
                  <span className="perc-inst-icon" style={{ '--inst-color': color }}>
                    {InstIcon && <InstIcon />}
                  </span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="perc-nav-btn"
            onClick={handlePreviousBar}
            disabled={selectedBar === 0}
            aria-label="Previous bar"
          >
            &lt;
          </button>

          <div className="perc-sequencer-panel custom-scrollbar">
            <div className="perc-grid-header">
              {Array.from({ length: PERC_COLUMNS }, (_, stepIdx) => {
                const isCurrent = isPlaying && selectedBar === currentBar && currentStep === stepIdx;

                return (
                  <div
                    key={stepIdx}
                    className={`perc-col-header ${isCurrent ? 'active' : ''}`}
                  >
                    {stepIdx + 1}
                  </div>
                );
              })}
            </div>

            <div className="perc-rows-container">
              {PERC_INSTRUMENTS.map(({ id, color }) => (
                <div key={id} className="perc-row">
                  {Array.from({ length: PERC_COLUMNS }, (_, stepIdx) => {
                    const cell = barData[stepIdx];
                    const isActive = cell?.instruments?.includes(id);
                    const isCurrent = isPlaying && selectedBar === currentBar && currentStep === stepIdx;

                    return (
                      <button
                        type="button"
                        key={stepIdx}
                        className={`perc-cell ${isActive ? 'lit' : ''} ${isCurrent ? 'cursor' : ''} ${isCurrent && isActive ? 'lit-cursor' : ''}`}
                        style={{ '--inst-color': color }}
                        onPointerDown={(e) => handleCellPointerDown(e, stepIdx, id)}
                        data-instrument={id}
                        data-col={stepIdx}
                      >
                        {ripples.map(r => r.stepIndex === stepIdx && r.instrumentId === id && (
                          <span key={r.id} className="cell-ripple" />
                        ))}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="perc-nav-btn"
            onClick={handleNextBar}
            disabled={selectedBar === totalBars - 1}
            aria-label="Next bar"
          >
            &gt;
          </button>
        </div>

        <div className="perc-bar-selector" aria-label="Bar selector">
          <span className="perc-bar-label">BAR</span>
          <div className="perc-bar-tabs">
            {Array.from({ length: totalBars }, (_, i) => (
              <button
                type="button"
                key={i}
                className={`perc-bar-tab ${i === selectedBar ? 'active' : ''} ${i === currentBar && isPlaying ? 'playing' : ''}`}
                onClick={() => setSelectedBar(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <span className="perc-page-indicator">{selectedBar + 1} / {totalBars}</span>
        </div>
      </div>
    </div>
  );
}
