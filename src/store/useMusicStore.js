import { create } from 'zustand';
import { CHORD_LIBRARY } from '../data/chords';
import { eighthToStep } from '../data/bassNotes';
import { TOTAL_BARS, STEPS_PER_BAR, CHORD_SPAN, TRACK_IDS } from '../domain/musicConstants';
import createTransportSlice from './slices/transportSlice';
import createMatrixSlice from './slices/matrixSlice';
import createContextSlice from './slices/contextSlice';

/** 和弦 ID → Bass 根音映射（使用采样音域 C1 D1 E1 F1 G1 A0 B0）*/
const CHORD_TO_BASS_ROOT = {
  'C':       'C1',
  'Am':      'A0',
  'F':       'F1',
  'G':       'G1',
  'Cmaj7':   'C1',
  'Cmaj9':   'C1',
  'Cadd9':   'C1',
  'Am7':     'A0',
  'Am9':     'A0',
  'Am(add9)':'A0',
  'Fmaj7':   'F1',
  'F6':      'F1',
  'Fadd9':   'F1',
  'G7':      'G1',
  'G9':      'G1',
  'Gsus4':   'G1',
  'Em/B':    'B0',
  'F#m7b5':  'F1',
  'G/B':     'B0',
  'E7':      'E1',
  'Fm':      'F1',
  'C/E':     'E1',
  'Abdim':   'G1',
  'D/F#':    'F1',
};

const TRACKS = TRACK_IDS;

const useMusicStore = create((set, get) => ({
  ...createTransportSlice(set, get),
  ...createMatrixSlice(set, get),
  ...createContextSlice(set, get),

  // -------- Actions: Chord 轨道专用 --------

  /**
   * 在 chord 轨道放入一个和弦积木块
   * @param {number} barIndex - 0~7
   * @param {number} beatIndex - 0~3（一个 bar 有 4 拍）
   * @param {string} chordId - 'C' | 'Am' | 'F' | 'G' 等
   */
  setChordBlock: (barIndex, beatIndex, chordId) => {
    const chord = CHORD_LIBRARY[chordId];
    if (!chord) return;

    const { matrix } = get();
    const newBar = [...matrix.chord[barIndex]];
    const startStep = beatIndex * CHORD_SPAN;

    // 在 CHORD_SPAN 个 step 上写入和弦数据
    for (let i = 0; i < CHORD_SPAN; i++) {
      const stepIdx = startStep + i;
      if (stepIdx < STEPS_PER_BAR) {
        newBar[stepIdx] = {
          chordId,
          baseChordId: chordId,
          notes: chord.notes,
          variationId: chordId,
          isHead: i === 0, // 只有第一个 step 标记为 head（渲染积木块用）
        };
      }
    }

    const newTrack = [...matrix.chord];
    newTrack[barIndex] = newBar;

    set({
      matrix: {
        ...matrix,
        chord: newTrack,
      },
    });
  },

  /**
   * 移除 chord 轨道某个位置的和弦积木块
   */
  removeChordBlock: (barIndex, beatIndex) => {
    const { matrix } = get();
    const newBar = [...matrix.chord[barIndex]];
    const startStep = beatIndex * CHORD_SPAN;

    for (let i = 0; i < CHORD_SPAN; i++) {
      const stepIdx = startStep + i;
      if (stepIdx < STEPS_PER_BAR) {
        newBar[stepIdx] = null;
      }
    }

    const newTrack = [...matrix.chord];
    newTrack[barIndex] = newBar;

    set({
      matrix: {
        ...matrix,
        chord: newTrack,
      },
    });
  },

  /**
   * 替换当前选中的和弦积木块属性（用于变体切换）
   * @param {number} barIndex
   * @param {number} stepIndex - head 的 stepIndex
   * @param {string} variationId - 变体的 ID
   * @param {string[]} notes - 变体组成的音数组
   */
  replaceChordBlock: (barIndex, stepIndex, variationId, notes) => {
    const { matrix } = get();
    const cell = matrix.chord[barIndex][stepIndex];
    if (!cell || !cell.isHead) return;

    const baseChordId = cell.baseChordId || cell.chordId;
    const newBar = [...matrix.chord[barIndex]];

    for (let i = 0; i < CHORD_SPAN; i++) {
        const sIdx = stepIndex + i;
        if (sIdx < STEPS_PER_BAR && newBar[sIdx]) {
            newBar[sIdx] = {
                ...newBar[sIdx],
                variationId,
                notes,
                baseChordId,
            };
        }
    }

    const newTrack = [...matrix.chord];
    newTrack[barIndex] = newBar;

    set({
      matrix: {
        ...matrix,
        chord: newTrack,
      },
    });
  },

  /**
   * Organize 功能：对整个小节执行切分转换
   * 前两拍保留原和弦，后两拍替换为过渡和弦
   */
  applyOrganizeTransition: (barIndex, baseChordId, tranChordId, tranNotes) => {
    const { setChordBlock } = get();
    // 强制写入第 1、2 拍为 baseChordId
    setChordBlock(barIndex, 0, baseChordId);
    setChordBlock(barIndex, 1, baseChordId);

    // 获取最新
    const newBar = [...get().matrix.chord[barIndex]];

    // 将第 3、4 拍（step 8 到 15）改写为过渡和弦
    for (let i = 8; i < STEPS_PER_BAR; i++) {
        newBar[i] = {
            chordId: tranChordId,
            baseChordId: baseChordId, // 仍保留 baseChordId 记录渊源
            notes: tranNotes,
            variationId: tranChordId,
            isHead: i === 8, // 第二部分的头
            isTransition: true
        };
    }

    const newTrack = [...get().matrix.chord];
    newTrack[barIndex] = newBar;

    set({
      matrix: {
        ...get().matrix,
        chord: newTrack,
      },
    });
  },

  // -------- Actions: Bass 轨道专用 --------

  /**
   * 一键匹配和弦进行：读取指定小节 chord 轨的和弦，
   * 在 Bass 矩阵的 第1、3、5、7 位（eighthIndex 0/2/4/6）写入各拍根音。
   * 已有同位置的 bass 音符将被覆盖，空拍位则跳过不写入。
   * @param {number} barIndex - 0~7
   */
  autoFillBassFromChord: (barIndex) => {
    const { matrix } = get();
    const chordBar = matrix.chord[barIndex];
    const newBar = [...matrix.bass[barIndex]];

    // 4 拍，每拍的 downbeat 八分音符位 = 拍序 * 2
    for (let beat = 0; beat < 4; beat++) {
      const eighthIndex = beat * 2;          // 0, 2, 4, 6
      const stepIndex = eighthIndex * 2;     // 0, 4, 8, 12（对应 chord 轨拍头 step）
      const cell = chordBar[stepIndex];
      if (!cell) continue;                   // 该拍无和弦，跳过

      // 优先取 chordId，再取 variationId（处理变体和过渡和弦）
      const chordId = cell.chordId || cell.variationId;
      const rootNote = CHORD_TO_BASS_ROOT[chordId];
      if (!rootNote) continue;               // 未知和弦，跳过

      newBar[eighthIndex * 2] = { note: rootNote, velocity: 100 };
    }

    const newTrack = [...matrix.bass];
    newTrack[barIndex] = newBar;
    set({ matrix: { ...matrix, bass: newTrack } });
  },

  /**
   * 切换 bass 矩阵中某个音符的开/关
   * @param {number} barIndex - 0~7
   * @param {number} eighthIndex - 0~7（八分音符位）
   * @param {string} note - 'C1' ~ 'G1' / 'A0' ~ 'B0'
   */
  toggleBassNote: (barIndex, eighthIndex, note) => {
    const { matrix } = get();
    const stepIndex = eighthToStep(eighthIndex);
    const newBar = [...matrix.bass[barIndex]];

    const existing = newBar[stepIndex];
    if (existing && existing.note === note) {
      // 已存在 → 关闭
      newBar[stepIndex] = null;
    } else {
      // 不存在或不同音符 → 写入
      newBar[stepIndex] = { note, velocity: 100 };
    }

    const newTrack = [...matrix.bass];
    newTrack[barIndex] = newBar;

    set({
      matrix: {
        ...matrix,
        bass: newTrack,
      },
    });
  },

  // -------- Actions: Perc 轨道专用 --------

  /**
   * 切换打击乐矩阵中某个音色的开/关
   * 允许多个音色在同一步进触发
   */
  togglePercNote: (barIndex, eighthIndex, instrumentId) => {
    const { matrix } = get();
    const stepIndex = eighthToStep(eighthIndex);
    const newBar = [...matrix.perc[barIndex]];

    const existingCell = newBar[stepIndex];
    let instruments = existingCell ? [...existingCell.instruments] : [];

    if (instruments.includes(instrumentId)) {
      // 存在则移除
      instruments = instruments.filter(id => id !== instrumentId);
    } else {
      // 不存在则添加
      instruments.push(instrumentId);
    }

    if (instruments.length > 0) {
      newBar[stepIndex] = { instruments };
    } else {
      newBar[stepIndex] = null;
    }

    const newTrack = [...matrix.perc];
    newTrack[barIndex] = newBar;

    set({
      matrix: {
        ...matrix,
        perc: newTrack,
      },
    });
  },

  /**
   * 一键生成基础律动：在指定小节写入固定 groove 模式
   *   第1位 (eighthIndex 0): Kick + HiHat
   *   第3位 (eighthIndex 2): HiHat
   *   第5位 (eighthIndex 4): Clap + Snare + HiHat
   *   第7位 (eighthIndex 6): HiHat
   * @param {number} barIndex - 0~7
   */
  autoFillPercGroove: (barIndex) => {
    const { matrix } = get();
    const newBar = [...matrix.perc[barIndex]];

    const GROOVE = [
      { eighthIndex: 0, instruments: ['kick', 'hihat'] },
      { eighthIndex: 2, instruments: ['hihat'] },
      { eighthIndex: 4, instruments: ['clap', 'snare', 'hihat'] },
      { eighthIndex: 6, instruments: ['hihat'] },
    ];

    for (const { eighthIndex, instruments } of GROOVE) {
      const stepIndex = eighthToStep(eighthIndex);
      // Merge with existing instruments at that step (don't erase others)
      const existing = newBar[stepIndex]?.instruments ?? [];
      const merged = [...new Set([...existing, ...instruments])];
      newBar[stepIndex] = { instruments: merged };
    }

    const newTrack = [...matrix.perc];
    newTrack[barIndex] = newBar;
    set({ matrix: { ...matrix, perc: newTrack } });
  },

  // -------- Actions: Lead 轨道专用 --------

  /**
   * 写入 lead 矩阵中某个音符（非 toggle，纯写入）
   */
  setLeadNote: (barIndex, eighthIndex, note) => {
    const { matrix } = get();
    const stepIndex = eighthToStep(eighthIndex);
    const newBar = [...matrix.lead[barIndex]];

    newBar[stepIndex] = { note, velocity: 100 };

    const newTrack = [...matrix.lead];
    newTrack[barIndex] = newBar;

    set({
      matrix: {
        ...matrix,
        lead: newTrack,
      },
    });
  },

  /**
   * 切换 lead 矩阵中某个音符的开/关
   * @param {number} barIndex - 0~7
   * @param {number} eighthIndex - 0~7（八分音符位）
   * @param {string} note - 'C3' ~ 'B3'
   */
  toggleLeadNote: (barIndex, eighthIndex, note) => {
    const { matrix } = get();
    const stepIndex = eighthToStep(eighthIndex);
    const newBar = [...matrix.lead[barIndex]];

    const existing = newBar[stepIndex];
    if (existing && existing.note === note) {
      // 已存在 → 关闭
      newBar[stepIndex] = null;
    } else {
      // 不存在或不同音符 → 写入
      newBar[stepIndex] = { note, velocity: 100 };
    }

    const newTrack = [...matrix.lead];
    newTrack[barIndex] = newBar;

    set({
      matrix: {
        ...matrix,
        lead: newTrack,
      },
    });
  },

  /**
   * 导出当前状态为 JSON（满足 README 5.3 数据序列化需求）
   */
  exportJSON: () => {
    const { bpm, matrix } = get();
    return JSON.stringify({ bpm, matrix }, null, 2);
  },

  /**
   * 从 JSON 导入状态
   */
  importJSON: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.bpm && data.matrix) {
        set({ bpm: data.bpm, matrix: data.matrix });
        return true;
      }
      return false;
    } catch {
      console.error('[MusicStore] importJSON failed: invalid JSON');
      return false;
    }
  },

  // -------- 预留硬件接口（README 5.3）--------
  onHardwareMessage: (type, data) => {
    console.log(`[HardwareMessage] type=${type}`, data);
    // 未来在此处理物理按键映射
  },
}));

export { TOTAL_BARS, STEPS_PER_BAR, CHORD_SPAN, TRACKS };
export default useMusicStore;
