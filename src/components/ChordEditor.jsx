import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { CHORD_LIBRARY, CHORD_VARIATIONS, ORGANIZE_TRANSITIONS } from '../data/chords';
import audioEngine from '../audio/AudioEngine';
import './ChordEditor.css';

/**
 * 流行乐预设：C - Am - F - G
 */
const STYLE_PRESETS = [
  {
    id: 'pop',
    label: '流行乐',
    desc: '基于 C·Am·F·G 的经典和声进行，在流行音乐创作中被广泛采用',
    chords: ['C', 'Am', 'F', 'G'],
    active: true,
  },
  { id: 'jazz', label: '爵士乐', desc: '基于 Dm·G·C 即可轻松创造出 Jazz 氛围', chords: [], active: false },
  { id: 'jpop', label: 'J-Pop', desc: '基于 F·G·Em·Am 的日系慵懒 Chill 感', chords: [], active: false },
];

/**
 * Transition patterns for the right panel
 * Each entry describes a "pivot" progression where the blue chord is draggable
 */
const TRANSITION_PATTERNS = [
  {
    id: 'C-Em-Am',
    label: 'C → Am',
    before: 'C',
    pivot: { chordId: 'Em/B', label: 'Em/B', notes: ['B3', 'E4', 'G4'] },
    after: 'Am',
    desc: '平滑引入 Am，制造一种"从光经缓缓到达黑暗"的情绪',
  },
  {
    id: 'F-Fm7-G',
    label: 'F → G',
    before: 'F',
    pivot: { chordId: 'F#m7b5', label: 'F#m7b5', notes: ['F#3', 'A3', 'C4', 'E4'] },
    after: 'G',
    desc: '过渡和弦会产生强烈的不协和张力，紧接着 G 的到来让听众释放紧张',
  },
];

/** Reusable draggable chord block */
function DragBlock({ chordId, label, notes, color, glowColor, variant = 'base', onDragStart, onDragEnd }) {
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0 && e.type.includes('mouse')) return; // left click / touch only
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    let didMove = false;

    // Dispatch start immediately with full style info for the global ghost
    window.dispatchEvent(
      new CustomEvent('chord-drag-start', {
        detail: { chordId, label, color, glowColor, clientX: startX, clientY: startY },
      })
    );
    if (onDragStart) onDragStart(chordId);

    // Use a variable instead of ref for throttle inside closure
    let lastMoveTime = 0;

    const onPointerMove = (ev) => {
      didMove = true;
      const now = Date.now();
      if (now - lastMoveTime < 16) return;
      lastMoveTime = now;

      window.dispatchEvent(
        new CustomEvent('chord-drag-move', {
          detail: { clientX: ev.clientX, clientY: ev.clientY, chordId },
        })
      );
    };

    const onPointerUp = (ev) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      window.dispatchEvent(
        new CustomEvent('chord-drag-end', {
          detail: { clientX: ev.clientX, clientY: ev.clientY, chordId },
        })
      );
      if (onDragEnd) onDragEnd();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [chordId, label, color, glowColor, onDragStart, onDragEnd]);

  return (
    <div
      className={`ce-block ce-block--${variant}`}
      style={{ '--cc': color, '--cg': glowColor }}
      onPointerDown={handlePointerDown}
    >
      <span className="ce-block-label">{label}</span>
      <span className="ce-block-notes">{notes.slice(0, 3).join(' ')}</span>
    </div>
  );
}

export default function ChordEditor() {
  const [activePreset, setActivePreset] = useState('pop');

  const preset = STYLE_PRESETS.find((p) => p.id === activePreset) || STYLE_PRESETS[0];
  const activeChords = preset.chords; // ['C', 'Am', 'F', 'G']

  return (
    <div className="chord-editor" id="chord-editor">

      {/* ── Panel 1: Style Presets ── */}
      <div className="ce-panel ce-panel--presets">
        <p className="ce-panel-title">选择和弦框架</p>
        <div className="ce-presets-list">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`ce-preset-btn ${activePreset === preset.id ? 'active' : ''} ${!preset.active ? 'placeholder' : ''}`}
              onClick={() => preset.active && setActivePreset(preset.id)}
            >
              <span className="ce-preset-name">{preset.label}</span>
              <span className="ce-preset-desc">{preset.desc}</span>
            </button>
          ))}
          <button className="ce-preset-btn placeholder ce-preset-more">
            <span className="ce-preset-name">······</span>
          </button>
        </div>
      </div>

      {/* ── Panel 2: Chord Variations ── */}
      <div className="ce-panel ce-panel--variations">
        <p className="ce-panel-title">丰富和弦听觉色彩</p>
        <div className="ce-variations-grid">
          {activeChords.map((rootId) => {
            const root = CHORD_LIBRARY[rootId];
            const variations = CHORD_VARIATIONS[rootId] || [];
            return (
              <div key={rootId} className="ce-variation-row">
                {/* Base chord (green) */}
                <DragBlock
                  chordId={rootId}
                  label={root.label}
                  notes={root.notes}
                  color={root.color}
                  glowColor={root.glowColor}
                  variant="base"
                />
                <span className="ce-arrow">→</span>
                {/* Variation chords (blue, skip index 0 which is the base itself) */}
                <div className="ce-variation-alts">
                  {variations.slice(1).map((v) => (
                    <div key={v.id} className="ce-variation-alt">
                      <DragBlock
                        chordId={v.id}
                        label={v.label}
                        notes={v.notes}
                        color="#2563EB"
                        glowColor="rgba(37,99,235,0.35)"
                        variant="alt"
                      />
                      <span className="ce-alt-desc">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Panel 3: Transition Patterns ── */}
      <div className="ce-panel ce-panel--transitions">
        <p className="ce-panel-title">增加戏剧感和张力</p>
        <div className="ce-transition-list">
          {TRANSITION_PATTERNS.map((tp) => {
            const beforeChord = CHORD_LIBRARY[tp.before];
            const afterChord = CHORD_LIBRARY[tp.after];
            return (
              <div key={tp.id} className="ce-transition-row">
                {/* Static label showing context */}
                <div className="ce-transition-context">
                  <span className="ce-transition-anchor">{tp.before}</span>
                  <span className="ce-transition-dash"> - </span>
                  <span className="ce-transition-anchor">{tp.after}</span>
                </div>
                <span className="ce-arrow">→</span>
                <div className="ce-transition-right">
                  {/* Pivot — The blue DRAGGABLE chord */}
                  <div className="ce-transition-pivot">
                    <DragBlock
                      chordId={tp.pivot.chordId}
                      label={tp.pivot.label}
                      notes={tp.pivot.notes}
                      color="#2563EB"
                      glowColor="rgba(37,99,235,0.35)"
                      variant="alt"
                    />
                    <span className="ce-alt-desc">{tp.desc}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
