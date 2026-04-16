import useMusicStore from '../store/useMusicStore';
import ChordEditor from './ChordEditor';
import BassMatrix from './BassMatrix';
import PercMatrix from './PercMatrix';
import LeadMatrix from './LeadMatrix';
import { ChordIcon, BassIcon, PercIcon, LeadIcon } from './Icons';
import './ContextArea.css';

/**
 * ContextArea — 底部动态内容区 (Bottom Drawer Style)
 *
 * 根据 activeContextTrack 切换显示:
 *   - null / 'chord' → ChordPalette（默认）
 *   - 'bass' → BassMatrix
 */
export default function ContextArea() {
  const activeContextTrack = useMusicStore((s) => s.activeContextTrack);
  const setActiveContextTrack = useMusicStore((s) => s.setActiveContextTrack);

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
        return <ChordEditor />;
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
    </div>
  );
}
