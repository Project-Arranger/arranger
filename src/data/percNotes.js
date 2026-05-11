/**
 * 打击乐器定义
 * 纵轴顺序：从上到下排列
 */

const PERC_INSTRUMENTS = [
  { id: 'kick',  label: 'Kick',   color: '#A5B4FC' },
  { id: 'snare', label: 'Snare',  color: '#FCA5A5' },
  { id: 'hihat', label: 'Hi-Hat', color: '#FDE68A' },
];

/** Perc 矩阵横轴: 16 个十六分音符位，对应一个 4/4 小节 */
const PERC_COLUMNS = 16;

export { PERC_INSTRUMENTS, PERC_COLUMNS };
