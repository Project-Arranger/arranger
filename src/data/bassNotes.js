/**
 * Bass 音符定义 — C2 到 B2 的半音阶
 * 
 * 从高到低排列（B2 在顶部，C2 在底部，标准 piano roll 布局）
 * inScale: 是否属于 C 大调音阶（C D E F G A B）
 */

const BASS_NOTES = [
  { note: 'B2',  label: 'B',  inScale: true  },
  { note: 'A#2', label: 'A#', inScale: false },
  { note: 'A2',  label: 'A',  inScale: true  },
  { note: 'G#2', label: 'G#', inScale: false },
  { note: 'G2',  label: 'G',  inScale: true  },
  { note: 'F#2', label: 'F#', inScale: false },
  { note: 'F2',  label: 'F',  inScale: true  },
  { note: 'E2',  label: 'E',  inScale: true  },
  { note: 'D#2', label: 'D#', inScale: false },
  { note: 'D2',  label: 'D',  inScale: true  },
  { note: 'C#2', label: 'C#', inScale: false },
  { note: 'C2',  label: 'C',  inScale: true  },
];

/** Bass 矩阵横轴: 8 个八分音符位，每个对应 16n 步进网格中的偶数位 */
const BASS_COLUMNS = 8;

/** 八分音符 index → 16n step index 的映射（0→0, 1→2, 2→4, ...） */
function eighthToStep(eighthIndex) {
  return eighthIndex * 2;
}

/** 16n step index → 八分音符 index （0→0, 2→1, 4→2, ...），奇数返回 -1 */
function stepToEighth(stepIndex) {
  if (stepIndex % 2 !== 0) return -1;
  return stepIndex / 2;
}

export { BASS_NOTES, BASS_COLUMNS, eighthToStep, stepToEighth };
