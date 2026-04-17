/**
 * Lead 音符定义 — 使用自定义采样音域 C3 ~ B3
 * 
 * 可用采样: Lead C3, Lead D3, Lead E3, Lead F3, Lead G3, Lead A3, Lead B3
 * 从高到低排列（B3 在顶部，C3 在底部，标准 piano roll 布局）
 * inScale: 是否属于 C 大调音阶（C D E F G A B）
 */

const LEAD_NOTES = [
  { note: 'B3',  label: 'B',  inScale: true  },
  { note: 'A3',  label: 'A',  inScale: true  },
  { note: 'G3',  label: 'G',  inScale: true  },
  { note: 'F3',  label: 'F',  inScale: true  },
  { note: 'E3',  label: 'E',  inScale: true  },
  { note: 'D3',  label: 'D',  inScale: true  },
  { note: 'C3',  label: 'C',  inScale: true  },
];

/** 键盘 1-7 → C D E F G A B (Octave 3) */
const KEY_TO_LEAD_NOTE = {
  '1': 'C3',
  '2': 'D3',
  '3': 'E3',
  '4': 'F3',
  '5': 'G3',
  '6': 'A3',
  '7': 'B3',
};

export { LEAD_NOTES, KEY_TO_LEAD_NOTE };
