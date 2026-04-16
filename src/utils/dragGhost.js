/**
 * dragGhost.js — Imperative, React-free drag ghost
 *
 * Creates a single fixed <div> directly on document.body,
 * completely outside of React's render tree.
 * This means zero re-render lag regardless of store updates.
 */

let ghostEl = null;

function ensureGhost() {
  if (ghostEl) return ghostEl;

  ghostEl = document.createElement('div');
  ghostEl.id = 'global-drag-ghost';
  ghostEl.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    z-index: 99999;
    pointer-events: none;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1.5px solid transparent;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    will-change: transform;
    contain: layout style;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    letter-spacing: 0.06em;
    color: #fff;
    white-space: nowrap;
    font-size: 0.82rem;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    opacity: 0;
    transform: translate3d(-9999px, -9999px, 0);
  `;
  document.body.appendChild(ghostEl);
  return ghostEl;
}

export function showDragGhost({ label, color, glowColor, clientX, clientY }) {
  const el = ensureGhost();
  el.textContent = label;
  el.style.background = `color-mix(in srgb, ${color || '#7aecf0'} 30%, #1a1a1e)`;
  el.style.borderColor = `color-mix(in srgb, ${color || '#7aecf0'} 60%, transparent)`;
  el.style.opacity = '1';
  el.style.transform = `translate3d(calc(${clientX}px - 50%), calc(${clientY}px - 50%), 0)`;
}

export function moveDragGhost(clientX, clientY) {
  if (!ghostEl) return;
  // Direct style mutation — fastest possible path
  ghostEl.style.transform = `translate3d(calc(${clientX}px - 50%), calc(${clientY}px - 50%), 0)`;
}

export function hideDragGhost() {
  if (!ghostEl) return;
  ghostEl.style.opacity = '0';
  ghostEl.style.transform = 'translate3d(-9999px, -9999px, 0)';
}
