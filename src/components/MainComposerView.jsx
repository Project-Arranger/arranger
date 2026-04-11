import { useState, useCallback } from 'react';
import useMusicStore from '../store/useMusicStore';
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

  return (
    <div className="main-composer" id="main-composer-view">
      {/* 顶部控制栏 */}
      <TransportBar />

      {/* 进度条 */}
      <ProgressBar />

      {/* 轨道概览区 */}
      <div className="track-overview" id="track-overview">
        <ChordTrack dragChordId={dragChordId} />
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
        <TrackRow trackId="lead" Icon={LeadIcon} label="LEAD" />
      </div>

      {/* 底部动态编辑区 */}
      <ContextArea
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
}
