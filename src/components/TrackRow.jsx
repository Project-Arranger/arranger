import useMusicStore from '../store/useMusicStore';
import './TrackRow.css';

const BEATS_PER_BAR = 4;
const STEPS_PER_BEAT = 4; // 16 steps / 4 beats

/**
 * TrackRow — Bass / Perc / Lead overview row
 * Steps grouped into beat-level units for beat-precise seek targeting
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

  const isActive = activeContextTrack === trackId;

  return (
    <div
      className={`track-row track-row-${trackId} ${isActive ? 'active-track' : ''}`}
      id={`track-${trackId}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
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
                    return (
                      <div
                        key={stepIdx}
                        className={`track-row-step ${cell ? 'filled' : ''} ${isCurrent ? 'active' : ''} ${stepIdx % 4 === 0 ? 'beat-start' : ''}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
