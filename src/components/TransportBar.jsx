import { useCallback, useState, useEffect } from 'react';
import useMusicStore from '../store/useMusicStore';
import audioEngine from '../audio/AudioEngine';
import './TransportBar.css';

/**
 * TransportBar — 顶部控制栏
 * 大尺寸 Play/Stop 按钮 + BPM + 位置显示
 */
export default function TransportBar() {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const globalBpm = useMusicStore((s) => s.bpm);
  const rootKey = useMusicStore((s) => s.rootKey);
  const setRootKey = useMusicStore((s) => s.setRootKey);
  const scale = useMusicStore((s) => s.scale);
  const setScale = useMusicStore((s) => s.setScale);
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const [isExporting, setIsExporting] = useState(false);
  const [localBpm, setLocalBpm] = useState(globalBpm.toString());

  // Sync local if global changes externally
  useEffect(() => {
    setLocalBpm(globalBpm.toString());
  }, [globalBpm]);

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
    setLocalBpm(e.target.value);
  }, []);

  const commitBpm = useCallback(() => {
    let value = parseInt(localBpm, 10);
    if (isNaN(value)) value = 120; // default if empty
    value = Math.max(40, Math.min(300, value));
    setLocalBpm(value.toString());
    audioEngine.setBpm(value);
  }, [localBpm]);

  const handleBpmKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur(); 
    }
  }, []);

  const adjustBpm = useCallback((delta, e) => {
    e.preventDefault(); // Prevent focus loss
    let value = parseInt(localBpm, 10);
    if (isNaN(value)) value = 120;
    value = Math.max(40, Math.min(300, value + delta));
    setLocalBpm(value.toString());
    audioEngine.setBpm(value);
  }, [localBpm]);

  const handleKeyChange = useCallback((e) => {
    setRootKey(e.target.value);
  }, [setRootKey]);

  const handleScaleChange = useCallback((e) => {
    setScale(e.target.value);
  }, [setScale]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const wavBlob = await audioEngine.exportWav();
      // create download link
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Arrangement_${globalBpm}BPM.wav`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Export failed:', err);
      alert('导出失败 (Export Failed: ' + err.message + ')');
    } finally {
      setIsExporting(false);
    }
  }, [globalBpm, isExporting]);

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
        {/* Key Display (Select) */}
        <div className="transport-btn transport-btn-key">
          <span className="transport-btn-label">1=</span>
          <select 
            className="key-select" 
            value={rootKey} 
            onChange={handleKeyChange}
          >
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <svg className="key-select-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        {/* Scale Display (Select) */}
        <div className="transport-btn transport-btn-scale">
          <span className="transport-btn-label">SCALE</span>
          <select 
            className="key-select scale-select" 
            value={scale} 
            onChange={handleScaleChange}
          >
            {['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <svg className="key-select-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <label className="bpm-group transport-btn" style={{ minWidth: '120px', cursor: 'text' }}>
          <span className="transport-btn-label" style={{ marginRight: '0px' }}>BPM</span>
          <button className="bpm-adjust-btn" onClick={(e) => adjustBpm(-5, e)}>−</button>
          <input
            id="bpm-input"
            type="number"
            min={40}
            max={300}
            value={localBpm}
            onChange={handleBpmChange}
            onBlur={commitBpm}
            onKeyDown={handleBpmKeyDown}
            className="bpm-input"
          />
          <button className="bpm-adjust-btn" onClick={(e) => adjustBpm(5, e)}>+</button>
        </label>
        
        <button
          className={`transport-btn transport-btn-export ${isExporting ? 'exporting' : ''}`}
          onClick={handleExport}
          disabled={isExporting}
          title="Export to WAV"
        >
          {isExporting ? (
            <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          )}
          <span className="transport-btn-label">{isExporting ? 'WAIT' : 'WAV'}</span>
        </button>
      </div>
    </div>
  );
}
