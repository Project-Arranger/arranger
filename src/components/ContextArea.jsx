import useMusicStore from '../store/useMusicStore';
import ChordEditor from './ChordEditor';
import BassMatrix from './BassMatrix';
import PercMatrix from './PercMatrix';
import LeadMatrix from './LeadMatrix';
import { ChordIcon, BassIcon, PercIcon, LeadIcon } from './Icons';
import { getEditorTrackLabel } from '../domain/editorTracks';
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
  const editorTrackStack = useMusicStore((s) => s.editorTrackStack);
  const activeEditorTrackEntryId = useMusicStore((s) => s.activeEditorTrackEntryId);

  const activeEditorTrackEntry =
    editorTrackStack.find(entry => entry.id === activeEditorTrackEntryId) ??
    editorTrackStack[editorTrackStack.length - 1] ??
    null;

  const renderContent = (trackId) => {
    switch (trackId) {
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

  const activeTrackId = activeEditorTrackEntry?.trackId ?? activeContextTrack;
  const ActiveIcon = {
    chord: ChordIcon,
    bass: BassIcon,
    perc: PercIcon,
    lead: LeadIcon,
  }[activeTrackId];

  if (!activeEditorTrackEntry) {
    return (
      <div className="context-area" id="context-area" style={{ position: 'relative' }}>
        <div className="empty-editor-state">
          <span className="empty-editor-kicker">TRACK EDITOR</span>
          <span>右侧音轨区为空。点击左侧轨道名右侧的 + 添加音轨。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="context-area" id="context-area" style={{ position: 'relative' }}>
      <div className="context-tabs">
        <div className="context-tab active">
          <span className="context-tab-inner">
            {ActiveIcon && <ActiveIcon active />}
            <span>{getEditorTrackLabel(activeEditorTrackEntry)}</span>
          </span>
        </div>
      </div>
      {/* 动态内容 */}
      {renderContent(activeEditorTrackEntry.trackId)}
    </div>
  );
}
