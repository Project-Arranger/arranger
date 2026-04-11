import { useState, useCallback } from 'react';
import TransportBar from './TransportBar';
import ProgressBar from './ProgressBar';
import ChordTrack from './ChordTrack';
import TrackRow from './TrackRow';
import ChordPalette from './ChordPalette';
import './MainComposerView.css';

/**
 * MainComposerView — 主编曲视图容器
 * 
 * 布局对应 README 中的 ASCII 原型:
 *   ┌─ TransportBar (Play/Stop/BPM) ─┐
 *   ├─ ProgressBar (8 小节进度) ──────┤
 *   ├─ TrackOverview ─────────────────┤
 *   │   CHORD: 和弦积木轨道           │
 *   │   BASS:  Bass 占位              │
 *   │   PERC:  打击占位               │
 *   │   LEAD:  旋律占位               │
 *   ├─ ChordPalette (底部积木面板) ───┤
 *   └────────────────────────────────┘
 */
export default function MainComposerView() {
  const [dragChordId, setDragChordId] = useState(null);

  const handleDragStart = useCallback((chordId) => {
    setDragChordId(chordId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragChordId(null);
  }, []);

  return (
    <div className="main-composer" id="main-composer-view">
      {/* 顶部控制栏 */}
      <TransportBar />

      {/* 进度条 */}
      <ProgressBar />

      {/* 轨道概览区 */}
      <div className="track-overview" id="track-overview">
        <ChordTrack dragChordId={dragChordId} />
        <TrackRow trackId="bass" icon="🎸" label="BASS" />
        <TrackRow trackId="perc" icon="🥁" label="PERC" />
        <TrackRow trackId="lead" icon="🎵" label="LEAD" />
      </div>

      {/* 底部和弦积木面板 */}
      <ChordPalette
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
}
