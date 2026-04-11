import { create } from 'zustand';
import { CHORD_LIBRARY } from '../data/chords';
import { eighthToStep } from '../data/bassNotes';

/**
 * 生成 8 小节的矩阵数据结构
 * 每个 track 有 8 个 bar，每个 bar 有 16 个 step
 * 
 * 数据结构:
 * matrix[trackId][barIndex][stepIndex] = cellData
 * 
 * cellData 格式:
 *   - chord track: { chordId: 'C', notes: ['C4','E4','G4'], isHead: true/false } | null
 *   - bass track:  { note: 'C2', velocity: 100 } | null
 *   - perc track:  { instruments: ['kick', 'hihat'] } | null
 *   - lead track:  { note: 'C4', velocity: 100 } | null
 */

const TOTAL_BARS = 8;
const STEPS_PER_BAR = 16;
/** 一个和弦块占据的 step 数（4 step = 1 拍） */
const CHORD_SPAN = 4;

const TRACKS = ['chord', 'bass', 'perc', 'lead'];

function createEmptyMatrix() {
  const matrix = {};
  TRACKS.forEach((trackId) => {
    matrix[trackId] = [];
    for (let bar = 0; bar < TOTAL_BARS; bar++) {
      matrix[trackId][bar] = [];
      for (let step = 0; step < STEPS_PER_BAR; step++) {
        matrix[trackId][bar][step] = null;
      }
    }
  });
  return matrix;
}

const useMusicStore = create((set, get) => ({
  // -------- Transport 状态 --------
  bpm: 120,
  isPlaying: false,

  // 当前播放位置 (0-indexed)
  currentBar: 0,
  currentStep: 0,

  // -------- Context Area 状态 --------
  /** 当前显示详情编辑器的轨道 ('bass' | 'chord' | null) */
  activeContextTrack: null,
  /** 当前正在编辑的小节 index (0~7) */
  selectedBar: 0,

  // -------- 矩阵数据 --------
  matrix: createEmptyMatrix(),

  // -------- 常量（暴露给组件用） --------
  totalBars: TOTAL_BARS,
  stepsPerBar: STEPS_PER_BAR,
  tracks: TRACKS,

  // -------- Actions: Transport --------
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ isPlaying: false, currentBar: 0, currentStep: 0 }),

  setBpm: (bpm) => {
    const clamped = Math.max(40, Math.min(300, bpm));
    set({ bpm: clamped });
  },

  /**
   * 更新当前播放位置（由 AudioEngine 调用）
   */
  setPosition: (bar, step) => set({ currentBar: bar, currentStep: step }),

  // -------- Actions: Matrix 编辑 --------

  /**
   * 设置某个 cell 的数据
   * @param {string} trackId - 'chord' | 'bass' | 'perc' | 'lead'
   * @param {number} barIndex - 0~7
   * @param {number} stepIndex - 0~15
   * @param {object|null} cellData - { note, velocity } 或 null（清除）
   */
  setCell: (trackId, barIndex, stepIndex, cellData) => {
    const { matrix } = get();
    // 深拷贝对应的 bar 以保持 immutable
    const newBar = [...matrix[trackId][barIndex]];
    newBar[stepIndex] = cellData;

    const newTrack = [...matrix[trackId]];
    newTrack[barIndex] = newBar;

    set({
      matrix: {
        ...matrix,
        [trackId]: newTrack,
      },
    });
  },

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
          notes: chord.notes,
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

  // -------- Actions: Context Area --------
  setActiveContextTrack: (trackId) => set({ activeContextTrack: trackId }),
  setSelectedBar: (barIndex) => set({ selectedBar: barIndex }),

  // -------- Actions: Bass 轨道专用 --------

  /**
   * 切换 bass 矩阵中某个音符的开/关
   * @param {number} barIndex - 0~7
   * @param {number} eighthIndex - 0~7（八分音符位）
   * @param {string} note - 'C2' ~ 'B2'
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
   * 清空整个矩阵
   */
  clearMatrix: () => set({ matrix: createEmptyMatrix() }),

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
