import useMusicStore from '../store/useMusicStore';
import './TrackRow.css';

/**
 * TrackRow — 占位轨道行（Bass / Perc / Lead）
 * 目前仅显示空的矩阵网格，未来实现具体交互
 */
export default function TrackRow({ trackId, Icon, label, onClick }) {
  const totalBars = useMusicStore((s) => s.totalBars);
  const stepsPerBar = useMusicStore((s) => s.stepsPerBar);
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const matrix = useMusicStore((s) => s.matrix);
  const activeContextTrack = useMusicStore((s) => s.activeContextTrack);

  const isActive = activeContextTrack === trackId;

  return (
    <div 
      className={`track-row track-row-${trackId} ${isActive ? 'active-track' : ''}`} 
      id={`track-${trackId}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="track-row-label">
        <span className="track-row-icon">{Icon && <Icon active={isActive} />}</span>
        <span className="track-row-text">{label}</span>
      </div>
      <div className="track-row-grid">
        {Array.from({ length: totalBars }, (_, barIdx) => (
          <div
            key={barIdx}
            className={`track-row-bar ${barIdx === currentBar && isPlaying ? 'current' : ''}`}
          >
            {Array.from({ length: stepsPerBar }, (_, stepIdx) => {
              const cell = matrix[trackId]?.[barIdx]?.[stepIdx];
              const isCurrent =
                isPlaying &&
                barIdx === currentBar &&
                stepIdx === currentStep;
              return (
                <div
                  key={stepIdx}
                  className={`track-row-step ${cell ? 'filled' : ''} ${isCurrent ? 'active' : ''} ${stepIdx % 4 === 0 ? 'beat-start' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
