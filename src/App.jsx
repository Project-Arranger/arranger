import { useCallback } from 'react';
import useMusicStore from './store/useMusicStore';
import audioEngine from './audio/AudioEngine';
import './App.css';

function App() {
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
    <div className="app">
      <h1>MusicToy — Engine Test</h1>

      <div className="transport">
        <button
          className={`btn ${isPlaying ? 'btn-active' : ''}`}
          onClick={handlePlayPause}
        >
          {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
        </button>

        <button className="btn" onClick={handleStop}>
          ■ STOP
        </button>

        <label className="bpm-control">
          BPM:
          <input
            type="number"
            min={40}
            max={300}
            value={bpm}
            onChange={handleBpmChange}
          />
        </label>
      </div>

      <div className="position-display">
        <span className="position-label">Position</span>
        <span className="position-value">
          {currentBar + 1} : {currentStep + 1}
        </span>
      </div>

      <p className="hint">
        打开浏览器 DevTools Console 查看实时 Bar:Step 打印输出
      </p>
    </div>
  );
}

export default App;
