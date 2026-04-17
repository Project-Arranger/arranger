/**
 * Bass 音符定义 — 使用自定义采样音域
 * 
 * 可用采样: C1 D1 E1 F1 G1 A0 B0
 * 从高到低排列（G1 在顶部，A0 在底部，标准 piano roll 布局）
 * inScale: 是否属于 C 大调音阶（C D E F G A B）
 */

const BASS_NOTES = [
  { note: 'G1',  label: 'G',  inScale: true  },
  { note: 'F1',  label: 'F',  inScale: true  },
  { note: 'E1',  label: 'E',  inScale: true  },
  { note: 'D1',  label: 'D',  inScale: true  },
  { note: 'C1',  label: 'C',  inScale: true  },
  { note: 'B0',  label: 'B',  inScale: true  },
  { note: 'A0',  label: 'A',  inScale: true  },
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
