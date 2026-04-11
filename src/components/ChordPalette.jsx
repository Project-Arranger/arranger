import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { CHORD_LIBRARY, AVAILABLE_CHORDS } from '../data/chords';
import audioEngine from '../audio/AudioEngine';
import './ChordPalette.css';

/**
 * ChordPalette — 底部和弦积木面板
 * 使用 Framer Motion 实现优雅的 1.1x 拖拽放大、圆角 12px 等高级响应。
 */
export default function ChordPalette({ onDragStart, onDragEnd }) {
  const [draggingId, setDraggingId] = useState(null);

  const handleDragStart = async (chordId) => {
    // 准备音频
    await audioEngine.init();
    setDraggingId(chordId);
    if (onDragStart) onDragStart(chordId);
  };

  const handleDrag = (e, info, chordId) => {
    window.dispatchEvent(
      new CustomEvent('chord-drag-move', {
        detail: {
          clientX: info.point.x,
          clientY: info.point.y,
          chordId,
        },
      })
    );
  };

  const handleDragEnd = (e, info, chordId) => {
    window.dispatchEvent(
      new CustomEvent('chord-drag-end', {
        detail: {
          clientX: info.point.x,
          clientY: info.point.y,
          chordId,
        },
      })
    );
    setDraggingId(null);
    if (onDragEnd) onDragEnd();
  };

  return (
    <div className="chord-palette" id="chord-palette">
      <div className="chord-palette-header">
        <span className="chord-palette-title">CHORDS</span>
        <span className="chord-palette-hint">拖动积木到轨道上方</span>
      </div>
      <div className="chord-palette-blocks">
        {AVAILABLE_CHORDS.map((chordId) => {
          const chord = CHORD_LIBRARY[chordId];
          const isDragging = draggingId === chordId;

          return (
            <motion.div
              key={chordId}
              drag
              dragSnapToOrigin
              onDragStart={() => handleDragStart(chordId)}
              onDrag={(e, info) => handleDrag(e, info, chordId)}
              onDragEnd={(e, info) => handleDragEnd(e, info, chordId)}
              whileDrag={{ 
                scale: 1.1, 
                boxShadow: `0 15px 30px rgba(0,0,0,0.5), 0 0 20px ${chord.glowColor}` 
              }}
              style={{
                '--chord-color': chord.color,
                '--chord-glow': chord.glowColor,
                zIndex: isDragging ? 9999 : 1, // 确保拖拽时在最上层
                borderRadius: '12px',
              }}
              className={`chord-block ${isDragging ? 'dragging' : ''}`}
            >
              <span className="chord-block-label">{chord.label}</span>
              <span className="chord-block-notes">
                {chord.notes.join(' ')}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
