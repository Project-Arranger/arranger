import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import useMusicStore from '../store/useMusicStore';
import audioEngine from '../audio/AudioEngine';
import TransportBar from './TransportBar';
import ProgressBar from './ProgressBar';
import ChordTrack from './ChordTrack';
import TrackRow from './TrackRow';
import ContextArea from './ContextArea';
import { BassIcon, PercIcon, LeadIcon } from './Icons';
import './MainComposerView.css';

/**
 * MainComposerView — 主编曲视图容器
 * 
 * 布局对应 README 中的 ASCII 原型:
 *   ┌─ TransportBar (Play/Stop/BPM) ─┐
 *   ├─ ProgressBar (8 小节进度) ──────┤
 *   ├─ TrackOverview ─────────────────┤
 *   │   CHORD: 和弦积木轨道           │
 *   │   BASS:  Bass 轨道              │
 *   │   PERC:  打击占位               │
 *   │   LEAD:  旋律占位               │
 *   ├─ ContextArea (底部动态编辑区) ──┤
 *   │   [Chord Tab] [Bass Tab]        │
 *   │   → ChordPalette / BassMatrix   │
 *   └────────────────────────────────┘
 */
export default function MainComposerView() {
  const [dragChordId, setDragChordId] = useState(null);
  const setActiveContextTrack = useMusicStore((s) => s.setActiveContextTrack);
  const setDragProgress = useMusicStore((s) => s.setDragProgress);
  const totalBars = useMusicStore((s) => s.totalBars);
  const stepsPerBar = useMusicStore((s) => s.stepsPerBar);

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

  const trackOverviewRef = useRef(null);

  // Logic to handle scrubbing/seeking from anywhere in TrackOverview
  const handleSeekUpdate = useCallback((e, isRelease = false) => {
    if (!trackOverviewRef.current) return;
    
    // Check if we are interacting with the grid areas
    const targetEl = e.target.closest('.chord-track-grid, .track-row-grid');
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const x = ((e.clientX || (e.touches && e.touches[0].clientX))) - rect.left;
    
    let progress = Math.max(0, Math.min(1, x / rect.width));

    if (isRelease) {
      // Seek on mouse release
      const finalProgress = useMusicStore.getState().dragProgress ?? progress;
      const totalStepsVal = totalBars * stepsPerBar;
      const targetGlobalStep = Math.floor(finalProgress * totalStepsVal);
      
      const bar = Math.floor(targetGlobalStep / stepsPerBar);
      const step = targetGlobalStep % stepsPerBar;
      
      setDragProgress(null);
      audioEngine.seekToStep(bar, step);
      audioEngine.play();
    } else {
      // Just update visual needle via store
      setDragProgress(progress);
    }
  }, [totalBars, stepsPerBar, setDragProgress]);

  const onMouseDown = (e) => {
    // Only capture if clicking on grid, otherwise let chord drag/clicking happen
    if (!e.target.closest('.chord-track-grid, .track-row-grid')) return;
    
    handleSeekUpdate(e, false);
    const onMouseMove = (me) => handleSeekUpdate(me, false);
    const onMouseUp = (me) => {
        handleSeekUpdate(me, true);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onTouchStart = (e) => {
    if (!e.target.closest('.chord-track-grid, .track-row-grid')) return;

    handleSeekUpdate(e, false);
    const onTouchMove = (te) => handleSeekUpdate(te, false);
    const onTouchEnd = (te) => {
        handleSeekUpdate(te, true);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
    };
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  };

  return (
    <div className="main-composer" id="main-composer-view">
      {/* 顶部控制栏 */}
      <TransportBar />

      {/* 进度条 */}
      <ProgressBar />

      {/* 轨道概览区 */}
      <div 
        className="track-overview" 
        id="track-overview" 
        ref={trackOverviewRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
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
