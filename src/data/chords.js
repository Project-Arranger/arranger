/**
 * 和弦定义 — 名称 + 钢琴音高 + 配色
 * 
 * notes: Tone.js 格式的音高数组（柱式和弦）
 * color: 积木块的标识色（HSL）
 * label: 显示名称
 */

const CHORD_LIBRARY = {
  C: {
    label: 'C',
    notes: ['C4', 'E4', 'G4'],
    color: 'hsl(200, 85%, 58%)',    // 天蓝
    glowColor: 'hsla(200, 85%, 58%, 0.5)',
  },
  Am: {
    label: 'Am',
    notes: ['A3', 'C4', 'E4'],
    color: 'hsl(270, 70%, 60%)',    // 紫罗兰
    glowColor: 'hsla(270, 70%, 60%, 0.5)',
  },
  F: {
    label: 'F',
    notes: ['F3', 'A3', 'C4'],
    color: 'hsl(340, 75%, 58%)',    // 玫瑰粉
    glowColor: 'hsla(340, 75%, 58%, 0.5)',
  },
  G: {
    label: 'G',
    notes: ['G3', 'B3', 'D4'],
    color: 'hsl(45, 90%, 55%)',     // 琥珀金
    glowColor: 'hsla(45, 90%, 55%, 0.5)',
  },
};

/**
 * 可用和弦列表（底部面板排列顺序）
 */
const AVAILABLE_CHORDS = ['C', 'Am', 'F', 'G'];

export { CHORD_LIBRARY, AVAILABLE_CHORDS };
