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

const AVAILABLE_CHORDS = ['C', 'Am', 'F', 'G'];

/**
 * 和弦变体拓展库
 * 每个根音包含若干变体，带情感描述
 */
const CHORD_VARIATIONS = {
  C: [
    { id: 'C', label: 'C', notes: ['C4', 'E4', 'G4'], desc: '纯净的大三和弦，根基稳定' },
    { id: 'Cmaj7', label: 'Cmaj7', notes: ['C4', 'E4', 'G4', 'B4'], desc: '明亮的爵士色彩，柔和浪漫' },
    { id: 'Cmaj9', label: 'Cmaj9', notes: ['C4', 'E4', 'G4', 'B4', 'D5'], desc: '梦幻般的高级感，城市之音' },
    { id: 'Cadd9', label: 'Cadd9', notes: ['C4', 'E4', 'G4', 'D5'], desc: '清新的民谣气息，开阔透亮' },
  ],
  Am: [
    { id: 'Am', label: 'Am', notes: ['A3', 'C4', 'E4'], desc: '基础自然小调，略带沉思' },
    { id: 'Am7', label: 'Am7', notes: ['A3', 'C4', 'E4', 'G4'], desc: '柔和的忧郁，顺滑的过渡' },
    { id: 'Am9', label: 'Am9', notes: ['A3', 'C4', 'E4', 'G4', 'B4'], desc: '深邃午夜氛围，现代R&B' },
    { id: 'Am(add9)', label: 'Am(add9)', notes: ['A3', 'C4', 'E4', 'B4'], desc: '悬疑与清冷，适合前奏情绪' },
  ],
  F: [
    { id: 'F', label: 'F', notes: ['F3', 'A3', 'C4'], desc: '温暖下属和弦，充满期待' },
    { id: 'Fmaj7', label: 'Fmaj7', notes: ['F3', 'A3', 'C4', 'E4'], desc: '极致的治愈感，日系标配' },
    { id: 'F6', label: 'F6', notes: ['F3', 'A3', 'C4', 'D4'], desc: '复古感与放松，回归80年代' },
    { id: 'Fadd9', label: 'Fadd9', notes: ['F3', 'A3', 'C4', 'G4'], desc: '展翅高飞的开阔感，充满希望' },
  ],
  G: [
    { id: 'G', label: 'G', notes: ['G3', 'B3', 'D4'], desc: '明亮的属和弦，强烈导向性' },
    { id: 'G7', label: 'G7', notes: ['G3', 'B3', 'D4', 'F4'], desc: '经典的紧张感，迫切求解' },
    { id: 'G9', label: 'G9', notes: ['G3', 'B3', 'D4', 'F4', 'A4'], desc: '布鲁斯与灵魂乐，醇厚动感' },
    { id: 'Gsus4', label: 'Gsus4', notes: ['G3', 'C4', 'D4'], desc: '漂浮未定的悬浮感，神秘朦胧' },
  ]
};

export { CHORD_LIBRARY, AVAILABLE_CHORDS, CHORD_VARIATIONS };
