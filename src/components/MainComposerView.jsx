import { useState, useCallback, useRef } from 'react';
import useMusicStore from '../store/useMusicStore';
import audioEngine from '../audio/AudioEngine';
import TransportBar from './TransportBar';
import ChordTrack from './ChordTrack';
import TrackRow from './TrackRow';
import ContextArea from './ContextArea';
import { BassIcon, PercIcon, LeadIcon } from './Icons';
import './MainComposerView.css';

/**
 * MainComposerView — 主编曲视图容器
 *
 * Ableton 风格播放头：
 *  - 不再有独立进度条，移除 ProgressBar
 *  - seekBar：用户点击设定的定位小节，在所有轨道上显示一个红色列框
 *  - 点击小节格子 → 设置 seekBar + 引擎 seek（不自动播放）
 *  - 播放中 seekBar 框不动，逐步点亮格子代表实时进度
 */
export default function MainComposerView() {
  const [dragChordId, setDragChordId] = useState(null);
  const setActiveContextTrack = useMusicStore((s) => s.setActiveContextTrack);
  const setSeekPosition = useMusicStore((s) => s.setSeekPosition);
  const trackOverviewRef = useRef(null);

  const handleDragStart = useCallback((chordId) => {
    setDragChordId(chordId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragChordId(null);
  }, []);

  const handleTrackClick = useCallback(
    (trackId) => {
      setActiveContextTrack(trackId);
    },
    [setActiveContextTrack]
  );

  /**
   * Click anywhere on the track grid → Ableton-style beat-level seek
   * 1. Detect which bar was clicked via data-bar
   * 2. Detect which beat via data-beat (if available) else compute from X position
   * 3. Seek engine, do NOT auto-play
   */
  const handleOverviewClick = useCallback((e) => {
    const barEl = e.target.closest('[data-bar]');
    if (!barEl) return;

    const barIndex = parseInt(barEl.dataset.bar, 10);
    if (isNaN(barIndex)) return;

    // Try beat from data-beat attribute (chord slot OR track-row-beat)
    const beatEl = e.target.closest('[data-beat]');
    let beatIndex = 0;
    if (beatEl && beatEl.dataset.beat !== undefined) {
      beatIndex = parseInt(beatEl.dataset.beat, 10);
    } else {
      // Compute beat from X position within the bar container
      const rect = barEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      beatIndex = Math.min(3, Math.floor(x * 4));
    }

    setSeekPosition(barIndex, beatIndex);
    audioEngine.seekToStep(barIndex, beatIndex * 4); // 4 steps per beat
  }, [setSeekPosition]);

  return (
    <div className="main-composer" id="main-composer-view">
      {/* 顶部控制栏 */}
      <TransportBar />

      {/* 轨道概览区 — ProgressBar 已移除，点击直接定位 */}
      <div
        className="track-overview"
        id="track-overview"
        ref={trackOverviewRef}
        onClick={handleOverviewClick}
        style={{ position: 'relative' }}
      >
        <ChordTrack
          dragChordId={dragChordId}
          onClick={() => handleTrackClick('chord')}
        />
        <TrackRow
          trackId="bass"
          Icon={BassIcon}
          label="BASS"
          onClick={() => handleTrackClick('bass')}
        />
        <TrackRow
          trackId="perc"
          Icon={PercIcon}
          label="PERC"
          onClick={() => handleTrackClick('perc')}
        />
        <TrackRow
          trackId="lead"
          Icon={LeadIcon}
          label="LEAD"
          onClick={() => handleTrackClick('lead')}
        />
      </div>

      {/* 底部动态编辑区 */}
      <ContextArea
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
}
