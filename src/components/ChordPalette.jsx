import { useRef, useCallback, useState } from 'react';
import { CHORD_LIBRARY, AVAILABLE_CHORDS } from '../data/chords';
import audioEngine from '../audio/AudioEngine';
import './ChordPalette.css';

/**
 * ChordPalette — 底部和弦积木面板
 * 
 * 提供 C, Am, F, G 四个大色块
 * 支持触屏拖拽：
 *   - touchstart → 创建 ghost 浮层 + 发光放大
 *   - touchmove → ghost 跟随手指 + 广播 chord-drag-move 事件
 *   - touchend → 广播 chord-drag-end 事件（ChordTrack 接收处理放入逻辑）
 */
export default function ChordPalette({ onDragStart, onDragEnd }) {
  const ghostRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const dragDataRef = useRef(null);

  /**
   * 创建 ghost 浮层元素
   */
  const createGhost = useCallback((chordId, x, y) => {
    const chord = CHORD_LIBRARY[chordId];
    const ghost = document.createElement('div');
    ghost.className = 'chord-ghost';
    ghost.textContent = chord.label;
    ghost.style.cssText = `
      position: fixed;
      left: ${x - 40}px;
      top: ${y - 30}px;
      width: 80px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #fff;
      border-radius: 12px;
      background: linear-gradient(135deg, ${chord.color}, color-mix(in srgb, ${chord.color} 70%, #000));
      border: 1.5px solid ${chord.color};
      box-shadow: 0 0 30px ${chord.glowColor}, 0 0 60px ${chord.glowColor}, 0 8px 24px rgba(0,0,0,0.5);
      transform: scale(1.15);
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.15s ease;
      text-shadow: 0 0 10px ${chord.glowColor};
    `;
    document.body.appendChild(ghost);
    return ghost;
  }, []);

  const handleTouchStart = useCallback(
    async (e, chordId) => {
      e.preventDefault();
      const touch = e.touches[0];

      // 初始化 AudioEngine（需要用户手势）
      await audioEngine.init();

      // 创建 ghost
      const ghost = createGhost(chordId, touch.clientX, touch.clientY);
      ghostRef.current = ghost;
      dragDataRef.current = { chordId };
      setDraggingId(chordId);

      if (onDragStart) onDragStart(chordId);
    },
    [createGhost, onDragStart]
  );

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!ghostRef.current) return;

    const touch = e.touches[0];
    ghostRef.current.style.left = `${touch.clientX - 40}px`;
    ghostRef.current.style.top = `${touch.clientY - 30}px`;

    // 广播拖拽中事件给 ChordTrack
    window.dispatchEvent(
      new CustomEvent('chord-drag-move', {
        detail: {
          clientX: touch.clientX,
          clientY: touch.clientY,
          chordId: dragDataRef.current?.chordId,
        },
      })
    );
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      e.preventDefault();

      // 获取最后的触摸点
      const touch = e.changedTouches[0];

      // 广播 drop 事件
      window.dispatchEvent(
        new CustomEvent('chord-drag-end', {
          detail: {
            clientX: touch.clientX,
            clientY: touch.clientY,
            chordId: dragDataRef.current?.chordId,
          },
        })
      );

      // 移除 ghost
      if (ghostRef.current) {
        ghostRef.current.style.transform = 'scale(0.5)';
        ghostRef.current.style.opacity = '0';
        setTimeout(() => {
          ghostRef.current?.remove();
          ghostRef.current = null;
        }, 200);
      }

      dragDataRef.current = null;
      setDraggingId(null);
      if (onDragEnd) onDragEnd();
    },
    [onDragEnd]
  );

  /**
   * 鼠标拖拽支持（桌面端）
   */
  const handleMouseDown = useCallback(
    async (e, chordId) => {
      e.preventDefault();
      await audioEngine.init();

      const ghost = createGhost(chordId, e.clientX, e.clientY);
      ghostRef.current = ghost;
      dragDataRef.current = { chordId };
      setDraggingId(chordId);
      if (onDragStart) onDragStart(chordId);

      const handleMouseMove = (ev) => {
        if (!ghostRef.current) return;
        ghostRef.current.style.left = `${ev.clientX - 40}px`;
        ghostRef.current.style.top = `${ev.clientY - 30}px`;

        window.dispatchEvent(
          new CustomEvent('chord-drag-move', {
            detail: {
              clientX: ev.clientX,
              clientY: ev.clientY,
              chordId: dragDataRef.current?.chordId,
            },
          })
        );
      };

      const handleMouseUp = (ev) => {
        window.dispatchEvent(
          new CustomEvent('chord-drag-end', {
            detail: {
              clientX: ev.clientX,
              clientY: ev.clientY,
              chordId: dragDataRef.current?.chordId,
            },
          })
        );

        if (ghostRef.current) {
          ghostRef.current.style.transform = 'scale(0.5)';
          ghostRef.current.style.opacity = '0';
          setTimeout(() => {
            ghostRef.current?.remove();
            ghostRef.current = null;
          }, 200);
        }

        dragDataRef.current = null;
        setDraggingId(null);
        if (onDragEnd) onDragEnd();

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [createGhost, onDragStart, onDragEnd]
  );

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
            <div
              key={chordId}
              className={`chord-block ${isDragging ? 'dragging' : ''}`}
              style={{
                '--chord-color': chord.color,
                '--chord-glow': chord.glowColor,
              }}
              onTouchStart={(e) => handleTouchStart(e, chordId)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={(e) => handleMouseDown(e, chordId)}
            >
              <span className="chord-block-label">{chord.label}</span>
              <span className="chord-block-notes">
                {chord.notes.join(' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
