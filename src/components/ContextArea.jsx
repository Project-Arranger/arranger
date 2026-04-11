import { AnimatePresence } from 'framer-motion';
import useMusicStore from '../store/useMusicStore';
import ChordPalette from './ChordPalette';
import BassMatrix from './BassMatrix';
import PercMatrix from './PercMatrix';
import LeadMatrix from './LeadMatrix';
import ChordVariationDrawer from './ChordVariationDrawer';
import { ChordIcon, BassIcon, PercIcon, LeadIcon } from './Icons';
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
  const selectedChordBlock = useMusicStore((s) => s.selectedChordBlock);

  const renderContent = () => {
    switch (activeContextTrack) {
      case 'perc':
        return <PercMatrix />;
      case 'bass':
        return <BassMatrix />;
      case 'lead':
        return <LeadMatrix />;
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
    <div className="context-area" id="context-area" style={{ position: 'relative' }}>
      {/* Tab 切换条 */}
      <div className="context-tabs">
        <button
          className={`context-tab ${!activeContextTrack || activeContextTrack === 'chord' ? 'active' : ''}`}
          onClick={() => setActiveContextTrack('chord')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <ChordIcon active={!activeContextTrack || activeContextTrack === 'chord'} />
             <span>CHORD</span>
          </div>
        </button>
        <button
          className={`context-tab ${activeContextTrack === 'bass' ? 'active' : ''}`}
          onClick={() => setActiveContextTrack('bass')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <BassIcon active={activeContextTrack === 'bass'} />
             <span>BASS</span>
          </div>
        </button>
        <button
          className={`context-tab ${activeContextTrack === 'perc' ? 'active' : ''}`}
          onClick={() => setActiveContextTrack('perc')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <PercIcon active={activeContextTrack === 'perc'} />
             <span>PERC</span>
          </div>
        </button>
        <button
          className={`context-tab ${activeContextTrack === 'lead' ? 'active' : ''}`}
          onClick={() => setActiveContextTrack('lead')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <LeadIcon active={activeContextTrack === 'lead'} />
             <span>LEAD</span>
          </div>
        </button>
      </div>
      {/* 动态内容 */}
      {renderContent()}

      {/* 变体抽屉 (Framer Motion 动画控制) */}
      <AnimatePresence>
        {selectedChordBlock && <ChordVariationDrawer />}
      </AnimatePresence>
    </div>
  );
}
