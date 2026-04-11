import useMusicStore from '../store/useMusicStore';
import ChordPalette from './ChordPalette';
import BassMatrix from './BassMatrix';
import './ContextArea.css';

/**
 * ContextArea — 底部动态内容区 (Bottom Drawer Style)
 *
 * 根据 activeContextTrack 切换显示:
 *   - null / 'chord' → ChordPalette（默认）
 *   - 'bass' → BassMatrix
 */
export default function ContextArea({ onDragStart, onDragEnd }) {
  const activeContextTrack = useMusicStore((s) => s.activeContextTrack);
  const setActiveContextTrack = useMusicStore((s) => s.setActiveContextTrack);

  const renderContent = () => {
    switch (activeContextTrack) {
      case 'bass':
        return <BassMatrix />;
      case 'chord':
      default:
        return (
          <ChordPalette
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        );
    }
  };

  return (
    <div className="context-area" id="context-area">
      {/* Tab 切换条 */}
      <div className="context-tabs">
        <button
          className={`context-tab ${!activeContextTrack || activeContextTrack === 'chord' ? 'active' : ''}`}
          onClick={() => setActiveContextTrack('chord')}
        >
          🎹 Chord
        </button>
        <button
          className={`context-tab ${activeContextTrack === 'bass' ? 'active' : ''}`}
          onClick={() => setActiveContextTrack('bass')}
        >
          🎸 Bass
        </button>
      </div>
      {/* 动态内容 */}
      {renderContent()}
    </div>
  );
}
