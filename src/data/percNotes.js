/**
 * 打击乐器定义
 * 纵轴顺序：从上到下排列
 */

const PERC_INSTRUMENTS = [
  { id: 'hihat', label: 'Hi-hat', color: '#7aecf0' },
  { id: 'clap',  label: 'Clap',   color: '#7aecf0' },
  { id: 'snare', label: 'Snare',  color: '#7aecf0' },
  { id: 'tom',   label: 'Tom',    color: '#7aecf0' },
  { id: 'kick',  label: 'Kick',   color: '#7aecf0' },
];

/** Perc 矩阵横轴: 8 个八分音符位，映射到 16n 步进网格中的偶数位 */
const PERC_COLUMNS = 8;

export { PERC_INSTRUMENTS, PERC_COLUMNS };
