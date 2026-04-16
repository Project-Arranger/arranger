import { useCallback, useRef, useEffect, useState } from 'react';
import useMusicStore, { CHORD_SPAN } from '../store/useMusicStore';
import { CHORD_LIBRARY } from '../data/chords';
import audioEngine from '../audio/AudioEngine';
import { ChordIcon } from './Icons';
import './ChordTrack.css';

const BEATS_PER_BAR = 4; // 每小节 4 拍

/**
 * ChordTrack — 和弦轨道（接收拖拽放入的积木块）
 * 
 * 结构: 8 bars × 4 beats = 32 个 slot
 * 每个 slot 可以容纳一个和弦积木块
 */
export default function ChordTrack({ dragChordId, onClick }) {
  const matrix = useMusicStore((s) => s.matrix);
  const activeContextTrack = useMusicStore((s) => s.activeContextTrack);
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const totalBars = useMusicStore((s) => s.totalBars);
  const setChordBlock = useMusicStore((s) => s.setChordBlock);
  const removeChordBlock = useMusicStore((s) => s.removeChordBlock);
  const setSelectedChordBlock = useMusicStore((s) => s.setSelectedChordBlock);
  const selectedChordBlock = useMusicStore((s) => s.selectedChordBlock);
  const seekBar = useMusicStore((s) => s.seekBar);
  const seekBeat = useMusicStore((s) => s.seekBeat);
  const trackRef = useRef(null);

  // 跟踪当前高亮的 drop slot
  const [highlightSlot, setHighlightSlot] = useState(null);

  /**
   * 根据触摸坐标计算对应的 { barIndex, beatIndex }
   */
  const getSlotFromPoint = useCallback((clientX, clientY) => {
    if (!trackRef.current) return null;
    const slots = trackRef.current.querySelectorAll('.chord-slot');
    for (const slot of slots) {
      const rect = slot.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return {
          barIndex: parseInt(slot.dataset.bar, 10),
          beatIndex: parseInt(slot.dataset.beat, 10),
        };
      }
    }
    return null;
  }, []);

  /**
   * 外部调用：拖拽中检测高亮 slot
   */
  useEffect(() => {
    const handleDragMove = (e) => {
      const detail = e.detail;
      if (!detail) return;
      const slot = getSlotFromPoint(detail.clientX, detail.clientY);
      setHighlightSlot(slot);
    };

    const handleDragEnd = (e) => {
      const detail = e.detail;
      setHighlightSlot(null);
      if (!detail) return;
      const slot = getSlotFromPoint(detail.clientX, detail.clientY);
      if (slot && detail.chordId) {
        setChordBlock(slot.barIndex, slot.beatIndex, detail.chordId);
        // 播放和弦预览
        const chord = CHORD_LIBRARY[detail.chordId];
        if (chord) {
          audioEngine.playChordPreview(chord.notes);
        }
      }
    };

    window.addEventListener('chord-drag-move', handleDragMove);
    window.addEventListener('chord-drag-end', handleDragEnd);

    return () => {
      window.removeEventListener('chord-drag-move', handleDragMove);
      window.removeEventListener('chord-drag-end', handleDragEnd);
    };
  }, [getSlotFromPoint, setChordBlock]);

  /**
   * 点击已有积木块 → 选中（弹出变体选项）
   */
  const handleSlotClick = useCallback(
    (barIndex, beatIndex, chordData) => {
      if (chordData) {
        setSelectedChordBlock({
          barIndex,
          stepIndex: beatIndex * CHORD_SPAN,
          baseChordId: chordData.baseChordId || chordData.chordId
        });
      }
    },
    [setSelectedChordBlock]
  );

  // 渲染 8 bars, 每 bar 4 beats
  const bars = [];
  for (let barIdx = 0; barIdx < totalBars; barIdx++) {
    const beats = [];
    for (let beatIdx = 0; beatIdx < BEATS_PER_BAR; beatIdx++) {
      const stepIdx = beatIdx * CHORD_SPAN;
      const cellData = matrix.chord[barIdx][stepIdx];
      const chordId = cellData?.chordId || null;
      const variationId = cellData?.variationId || chordId; // 使用变体 ID 展示
      const baseChordId = cellData?.baseChordId || chordId;
      const chord = baseChordId ? CHORD_LIBRARY[baseChordId] : null;

      const isCurrentBeat =
        isPlaying &&
        barIdx === currentBar &&
        Math.floor(currentStep / CHORD_SPAN) === beatIdx;

      const isHighlighted =
        highlightSlot &&
        highlightSlot.barIndex === barIdx &&
        highlightSlot.beatIndex === beatIdx;

      const isSelected = 
        selectedChordBlock &&
        selectedChordBlock.barIndex === barIdx &&
        selectedChordBlock.stepIndex === stepIdx;

      const isTransition = cellData?.isTransition;

      const isSeekBeat = barIdx === seekBar && beatIdx === seekBeat;

      beats.push(
        <div
          key={`${barIdx}-${beatIdx}`}
          className={`chord-slot ${chordId ? 'filled' : 'empty'} ${isCurrentBeat ? 'playing' : ''} ${isHighlighted ? 'highlight' : ''} ${isSelected ? 'selected' : ''} ${isTransition ? 'transition' : ''} ${isSeekBeat ? 'seek-beat' : ''}`}
          data-bar={barIdx}
          data-beat={beatIdx}
          onClick={() => handleSlotClick(barIdx, beatIdx, cellData)}
          style={
            chord
              ? {
                  '--chord-color': chord.color,
                  '--chord-glow': chord.glowColor,
                }
              : isHighlighted && dragChordId
              ? {
                  '--chord-color': CHORD_LIBRARY[dragChordId]?.color,
                  '--chord-glow': CHORD_LIBRARY[dragChordId]?.glowColor,
                }
              : {}
          }
        >
          {chordId && (
            <span className="chord-slot-label">{variationId}</span>
          )}
          {isCurrentBeat && chordId && <div className="chord-ripple" />}
        </div>
      );
    }

    bars.push(
      <div
        key={barIdx}
        className={`chord-bar ${barIdx === currentBar && isPlaying ? 'current-bar' : ''} ${barIdx === seekBar ? 'seek-bar' : ''}`}
        data-bar={barIdx}
      >
        {beats}
      </div>
    );
  }

  const isActive = !activeContextTrack || activeContextTrack === 'chord';

  return (
    <div 
      className={`chord-track ${isActive ? 'active-track' : ''}`} 
      id="chord-track" 
      ref={trackRef}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="track-label">
        <span className="track-label-icon"><ChordIcon active={isActive} /></span>
        <span className="track-label-text">CHORD</span>
      </div>
      <div className="chord-track-grid">
        {bars}
      </div>
    </div>
  );
}
