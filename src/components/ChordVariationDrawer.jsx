import { useState } from 'react';
import { motion } from 'framer-motion';
import useMusicStore from '../store/useMusicStore';
import { CHORD_VARIATIONS, CHORD_LIBRARY, ORGANIZE_TRANSITIONS } from '../data/chords';
import audioEngine from '../audio/AudioEngine';
import './ChordVariationDrawer.css';

/**
 * ChordVariationDrawer — 和弦变体抽屉
 * 当用户点击已放置的 Chord 积木时，从下方弹出。
 */
export default function ChordVariationDrawer() {
  const [isOrganizeMode, setIsOrganizeMode] = useState(false);
  
  const selectedChordBlock = useMusicStore((s) => s.selectedChordBlock);
  const setSelectedChordBlock = useMusicStore((s) => s.setSelectedChordBlock);
  const replaceChordBlock = useMusicStore((s) => s.replaceChordBlock);
  const applyOrganizeTransition = useMusicStore((s) => s.applyOrganizeTransition);
  const removeChordBlock = useMusicStore((s) => s.removeChordBlock);
  const matrix = useMusicStore((s) => s.matrix);

  if (!selectedChordBlock) return null;

  const { barIndex, stepIndex, baseChordId } = selectedChordBlock;
  const variations = CHORD_VARIATIONS[baseChordId] || [];
  const transitions = ORGANIZE_TRANSITIONS[baseChordId] || [];
  
  // 获取当前实际选择的变体/过渡 ID
  const cell = matrix.chord[barIndex]?.[stepIndex];
  const currentVariationId = cell?.variationId || cell?.chordId;
  const baseColor = CHORD_LIBRARY[baseChordId]?.color || '#fff';

  const handleSelectVariation = async (variation) => {
    if (isOrganizeMode) {
      applyOrganizeTransition(barIndex, baseChordId, variation.id, variation.notes);
    } else {
      replaceChordBlock(barIndex, stepIndex, variation.id, variation.notes);
    }
    await audioEngine.playChordPreview(variation.notes);
  };

  const handleRemove = () => {
    // 积木块对应的 beatIndex (stepIndex / 4)
    const beatIndex = Math.floor(stepIndex / 4);
    removeChordBlock(barIndex, beatIndex);
    setSelectedChordBlock(null);
  };

  const currentBarString = `Bar ${barIndex + 1}`;

  return (
    <motion.div
      className="chord-variation-drawer"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
    >
      <div className="cv-header">
        <div className="cv-header-title">
          <span className="cv-base-chord" style={{ color: baseColor }}>{baseChordId}</span>
          <span className="cv-subtitle">
            {isOrganizeMode ? `Transitions (Bar ${barIndex + 1})` : `Variations (Bar ${barIndex + 1})`}
          </span>
        </div>
        <div className="cv-actions">
          <button 
            className={`cv-btn ${isOrganizeMode ? 'cv-btn-active' : 'cv-btn-secondary'}`} 
            onClick={() => setIsOrganizeMode(!isOrganizeMode)}
          >
            {isOrganizeMode ? 'Variations' : 'Organize'}
          </button>
          <button className="cv-btn cv-btn-danger" onClick={handleRemove}>
            Delete
          </button>
          <button className="cv-btn cv-btn-close" onClick={() => setSelectedChordBlock(null)}>
            Done
          </button>
        </div>
      </div>

      <div className="cv-list">
        {(isOrganizeMode ? transitions : variations).map((v) => {
          const isActive = v.id === currentVariationId;
          return (
            <div
              key={v.id}
              className={`cv-card ${isActive ? 'active' : ''}`}
              onClick={() => handleSelectVariation(v)}
              style={isActive ? { borderColor: baseColor, boxShadow: `0 0 15px ${baseColor}40` } : {}}
            >
              <div className="cv-card-top">
                <span className="cv-card-title">{v.label}</span>
                <span className="cv-card-notes">{v.notes.map(n => n.slice(0, -1)).join(' ')}</span>
              </div>
              <div className="cv-card-desc">{v.desc}</div>
              {isActive && <div className="cv-active-indicator" style={{ background: baseColor }} />}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
