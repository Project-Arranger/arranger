import useMusicStore from '../store/useMusicStore';
import './ProgressBar.css';

/**
 * ProgressBar — 粗进度条，显示 8 小节播放进度
 * 可视化当前小节位置，方便触屏操作
 */
export default function ProgressBar() {
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const totalBars = useMusicStore((s) => s.totalBars);
  const stepsPerBar = useMusicStore((s) => s.stepsPerBar);
  const isPlaying = useMusicStore((s) => s.isPlaying);

  return (
    <div className="progress-bar" id="progress-bar">
      <div className="progress-segments">
        {Array.from({ length: totalBars }, (_, barIdx) => {
          const isCurrent = barIdx === currentBar;
          const isPast = barIdx < currentBar;
          const fillPercent = isCurrent
            ? ((currentStep + 1) / stepsPerBar) * 100
            : isPast
            ? 100
            : 0;

          return (
            <div
              key={barIdx}
              className={`progress-segment ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}
            >
              <div
                className="progress-fill"
                style={{ width: `${fillPercent}%` }}
              />
              <span className="progress-segment-label">{barIdx + 1}</span>
            </div>
          );
        })}
      </div>
      <span className="progress-info">
        BAR {currentBar + 1}/{totalBars}
      </span>
    </div>
  );
}
