import { useCallback, useState, useEffect } from 'react';
import { Download, Pause, Play, Plus, RotateCcw, Settings, Square } from 'lucide-react';
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
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const setSeekPosition = useMusicStore((s) => s.setSeekPosition);
  const setSelectedBar = useMusicStore((s) => s.setSelectedBar);
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
    setSeekPosition(0, 0);
    setSelectedBar(0);
  }, [setSeekPosition, setSelectedBar]);

  const handleReturnToStart = useCallback(async () => {
    setSeekPosition(0, 0);
    setSelectedBar(0);
    await audioEngine.seekToStep(0, 0);
  }, [setSeekPosition, setSelectedBar]);

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
        <div className="project-brand">
          <h1>Aria DAW</h1>
          <span>Project Alpha</span>
        </div>

        <button type="button" className="new-song-btn">
          <Plus size={18} strokeWidth={2.4} />
          <span>New Song</span>
        </button>

        <div className="transport-divider" />

        <div className="transport-controls">
          <button
            type="button"
            className="transport-icon-btn"
            aria-label="Return to first bar"
            title="回到首小节"
            onClick={handleReturnToStart}
          >
            <RotateCcw size={18} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            id="btn-stop"
            className="transport-icon-btn"
            aria-label="Stop"
            title="停止"
            onClick={handleStop}
          >
            <Square size={15} fill="currentColor" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            id="btn-play"
            className={`transport-icon-btn transport-icon-play ${isPlaying ? 'active' : ''}`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? '暂停' : '播放'}
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
          </button>
        </div>
      </div>

      <div className="transport-center">
        <div className="dashboard-display" aria-label="Song dashboard">
          <div className="dashboard-field">
            <span className="dashboard-label">POSITION</span>
            <span className="dashboard-value">{currentBar + 1} / {Math.floor(currentStep / 4) + 1}</span>
          </div>
          <div className="dashboard-separator" />
          <label className="dashboard-field dashboard-field-bpm">
            <span className="dashboard-label">BPM</span>
            <span className="bpm-control">
              <button type="button" className="bpm-adjust-btn" onClick={(e) => adjustBpm(-5, e)}>-</button>
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
              <button type="button" className="bpm-adjust-btn" onClick={(e) => adjustBpm(5, e)}>+</button>
            </span>
          </label>
          <div className="dashboard-separator" />
          <label className="dashboard-field dashboard-field-key">
            <span className="dashboard-label">KEY</span>
            <span className="key-control">
              <span>1=</span>
              <select
                className="key-select"
                value={rootKey}
                onChange={handleKeyChange}
                aria-label="Song key"
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </span>
          </label>
          <div className="dashboard-separator" />
          <button type="button" className="dashboard-field dashboard-field-sig" title="Time signature">
            <span className="dashboard-label">SIG</span>
            <span className="dashboard-value">4/4</span>
          </button>
        </div>
      </div>

      <div className="transport-right">
        <button
          type="button"
          className={`export-btn ${isExporting ? 'exporting' : ''}`}
          onClick={handleExport}
          disabled={isExporting}
          title="Export to WAV"
        >
          {isExporting ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <Download size={17} strokeWidth={2.4} />
          )}
          <span>{isExporting ? 'Exporting' : 'Export'}</span>
        </button>
        <button type="button" className="settings-btn" aria-label="Settings" title="Settings">
          <Settings size={19} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
