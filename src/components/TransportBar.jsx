import { useCallback } from 'react';
import useMusicStore from '../store/useMusicStore';
import audioEngine from '../audio/AudioEngine';
import './TransportBar.css';

/**
 * TransportBar — 顶部控制栏
 * 大尺寸 Play/Stop 按钮 + BPM + 位置显示
 */
export default function TransportBar() {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const bpm = useMusicStore((s) => s.bpm);
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.play();
    }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    audioEngine.stop();
  }, []);

  const handleBpmChange = useCallback((e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      audioEngine.setBpm(value);
    }
  }, []);

  return (
    <div className="transport-bar" id="transport-bar">
      <div className="transport-left">
        <button
          id="btn-play"
          className={`transport-btn transport-btn-play ${isPlaying ? 'active' : ''}`}
          onTouchStart={handlePlayPause}
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
          <span className="transport-btn-label">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <button
          id="btn-stop"
          className="transport-btn transport-btn-stop"
          onTouchStart={handleStop}
          onClick={handleStop}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="14" height="14" rx="2"></rect>
          </svg>
          <span className="transport-btn-label">STOP</span>
        </button>
      </div>

      <div className="transport-center">
        <div className="transport-position">
          <span className="position-bar">{currentBar + 1}</span>
          <span className="position-separator">:</span>
          <span className="position-step">{String(currentStep + 1).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="transport-right">
        <label className="bpm-group">
          <span className="bpm-label">BPM</span>
          <input
            id="bpm-input"
            type="number"
            min={40}
            max={300}
            value={bpm}
            onChange={handleBpmChange}
            className="bpm-input"
          />
        </label>
      </div>
    </div>
  );
}
