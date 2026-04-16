import { useCallback, useRef, useEffect, useState } from 'react';
import useMusicStore, { CHORD_SPAN } from '../store/useMusicStore';
import { CHORD_LIBRARY } from '../data/chords';
import audioEngine from '../audio/AudioEngine';
import { showDragGhost, moveDragGhost, hideDragGhost } from '../utils/dragGhost';
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

  // ── External palette drag: highlight drop slot ──
  const [highlightSlot, setHighlightSlot] = useState(null);
  const highlightSlotRef = useRef(null);

  // 缓存所有 slot 的位置
  const slotRectsRef = useRef([]);

  // ── Internal block drag (reorder / delete) ──
  const [internalDrag, setInternalDrag] = useState(null);
  // internalDrag = { chordId, variationId, color, glowColor,
  //                  fromBar, fromBeat, ghostX, ghostY, overDelete }
  const internalDragRef = useRef(null); // mirror for event handlers

  /**
   * 刷新所有 slot 的位置缓存
   */
  const refreshSlotRects = useCallback(() => {
    if (!trackRef.current) return;
    const slots = trackRef.current.querySelectorAll('.chord-slot');
    const rects = [];
    slots.forEach(slot => {
      rects.push({
        barIndex: parseInt(slot.dataset.bar, 10),
        beatIndex: parseInt(slot.dataset.beat, 10),
        rect: slot.getBoundingClientRect()
      });
    });
    slotRectsRef.current = rects;
  }, []);

  /**
   * 根据坐标在缓存中查找对应的 { barIndex, beatIndex }
   */
  const getSlotFromPoint = useCallback((clientX, clientY) => {
    for (const item of slotRectsRef.current) {
      const { rect } = item;
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return { barIndex: item.barIndex, beatIndex: item.beatIndex };
      }
    }
    return null;
  }, []);

  /**
   * 外部调用：拖拽中检测高亮 slot
   */
  useEffect(() => {
    const handleDragStart = () => {
      // 拖拽开始时刷新一次缓存即可
      refreshSlotRects();
    };

    const handleDragMove = (e) => {
      const detail = e.detail;
      if (!detail) return;
      const slot = getSlotFromPoint(detail.clientX, detail.clientY);
      
      const prev = highlightSlotRef.current;
      const isSame = 
        (!prev && !slot) || 
        (prev && slot && prev.barIndex === slot.barIndex && prev.beatIndex === slot.beatIndex);

      if (!isSame) {
        highlightSlotRef.current = slot;
        setHighlightSlot(slot);
      }
    };

    const handleDragEnd = (e) => {
      const detail = e.detail;
      highlightSlotRef.current = null;
      setHighlightSlot(null);
      if (!detail) return;
      // 结束时使用当前坐标最后判定一次
      const slot = getSlotFromPoint(detail.clientX, detail.clientY);
      if (slot && detail.chordId) {
        setChordBlock(slot.barIndex, slot.beatIndex, detail.chordId);
        // 播放和弦预览
        const chord = CHORD_LIBRARY[detail.chordId];
        if (chord) {
          audioEngine.playChordPreview(chord.notes);
        }
      }
      slotRectsRef.current = []; // 清空缓存
    };

    window.addEventListener('chord-drag-start', handleDragStart);
    window.addEventListener('chord-drag-move', handleDragMove);
    window.addEventListener('chord-drag-end', handleDragEnd);

    return () => {
      window.removeEventListener('chord-drag-start', handleDragStart);
      window.removeEventListener('chord-drag-move', handleDragMove);
      window.removeEventListener('chord-drag-end', handleDragEnd);
    };
  }, [getSlotFromPoint, refreshSlotRects, setChordBlock]);

  /**
   * 点击已有积木块 → 选中（弹出变体选项）
   * 只有在没有发生拖动时才触发
   */
  const handleSlotClick = useCallback(
    (barIndex, beatIndex, chordData) => {
      if (chordData && !internalDragRef.current?.didMove) {
        setSelectedChordBlock({
          barIndex,
          stepIndex: beatIndex * CHORD_SPAN,
          baseChordId: chordData.baseChordId || chordData.chordId
        });
      }
    },
    [setSelectedChordBlock]
  );

  /**
   * Internal drag: pointer down on a filled slot starts reorder/delete mode
   */
  const handleBlockPointerDown = useCallback(
    (e, barIndex, beatIndex, cellData) => {
      if (!cellData?.chordId) return;
      e.stopPropagation();
      e.currentTarget.releasePointerCapture(e.pointerId);

      const chord = CHORD_LIBRARY[cellData.chordId];
      const dragState = {
        chordId: cellData.chordId,
        variationId: cellData.variationId || cellData.chordId,
        color: chord?.color,
        glowColor: chord?.glowColor,
        fromBar: barIndex,
        fromBeat: beatIndex,
        overDelete: false,
        didMove: false,
      };
      internalDragRef.current = dragState;
      setInternalDrag({ ...dragState });
      window.dispatchEvent(new CustomEvent('drag-active-start'));

      showDragGhost({
        label: dragState.variationId,
        color: chord?.color,
        glowColor: chord?.glowColor,
        clientX: e.clientX,
        clientY: e.clientY,
      });

      let rafId = null;
      const onPointerMove = (ev) => {
        // Ghost: direct DOM call — no RAF, no event bus
        moveDragGhost(ev.clientX, ev.clientY);

        // Drop-target + state logic via RAF
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const d = internalDragRef.current;
          if (!d) return;
          d.didMove = true;

          // Check if hovering the delete zone
          const deleteZone = document.getElementById('global-arrangement-delete-zone');
          let overDelete = false;
          if (deleteZone) {
            const rect = deleteZone.getBoundingClientRect();
            overDelete =
              ev.clientX >= rect.left && ev.clientX <= rect.right &&
              ev.clientY >= rect.top  && ev.clientY <= rect.bottom;
          }

          // Check hovered slot
          const slot = getSlotFromPoint(ev.clientX, ev.clientY);

          let statusChanged = false;
          if (d.overDelete !== overDelete) {
            d.overDelete = overDelete;
            statusChanged = true;
            window.dispatchEvent(new CustomEvent('drag-over-delete', { detail: { over: overDelete } }));
          }

          const prevSlot = highlightSlotRef.current;
          const isSameSlot = 
            (!prevSlot && !slot) || 
            (prevSlot && slot && prevSlot.barIndex === slot.barIndex && prevSlot.beatIndex === slot.beatIndex);

          if (!isSameSlot) {
            highlightSlotRef.current = slot;
            // Disable highlighting if over delete zone
            setHighlightSlot(overDelete ? null : slot);
          }

          if (statusChanged) {
            setInternalDrag({ ...d });
          }
        });
      };

      const onPointerUp = (ev) => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        hideDragGhost();
        window.dispatchEvent(new CustomEvent('drag-active-end'));

        const d = internalDragRef.current;
        internalDragRef.current = null;
        setInternalDrag(null);
        highlightSlotRef.current = null;
        setHighlightSlot(null);

        if (!d || !d.didMove) return;

        // Drop on delete zone → remove
        if (d.overDelete) {
          removeChordBlock(d.fromBar, d.fromBeat);
          return;
        }

        // Drop on a different valid slot → move
        const targetSlot = getSlotFromPoint(ev.clientX, ev.clientY);
        if (
          targetSlot &&
          (targetSlot.barIndex !== d.fromBar || targetSlot.beatIndex !== d.fromBeat)
        ) {
          setChordBlock(targetSlot.barIndex, targetSlot.beatIndex, d.chordId);
          removeChordBlock(d.fromBar, d.fromBeat);
          const targetChord = CHORD_LIBRARY[d.chordId];
          if (targetChord) audioEngine.playChordPreview(targetChord.notes);
        }
      };

      refreshSlotRects();
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [getSlotFromPoint, refreshSlotRects, removeChordBlock, setChordBlock]
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

      // During internal drag, hide & ghost-ify the source block
      const isBeingDragged =
        internalDrag &&
        internalDrag.fromBar === barIdx &&
        internalDrag.fromBeat === beatIdx;

      beats.push(
        <div
          key={`${barIdx}-${beatIdx}`}
          className={`chord-slot ${chordId ? 'filled' : 'empty'} ${isCurrentBeat ? 'playing' : ''} ${isHighlighted ? 'highlight' : ''} ${isSelected ? 'selected' : ''} ${isTransition ? 'transition' : ''} ${isSeekBeat ? 'seek-beat' : ''} ${isBeingDragged ? 'dragging-source' : ''}`}
          data-bar={barIdx}
          data-beat={beatIdx}
          onClick={() => handleSlotClick(barIdx, beatIdx, cellData)}
          onPointerDown={chordId ? (e) => handleBlockPointerDown(e, barIdx, beatIdx, cellData) : undefined}
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
          {chordId && !isBeingDragged && (
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

      {/* Global arrangement delete zone used via ID / events */}
      {/* Ghost is rendered by dragGhost.js on document.body — no React */}
    </div>
  );
}
