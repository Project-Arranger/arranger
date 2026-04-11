import { create } from 'zustand';

/**
 * 生成 8 小节的矩阵数据结构
 * 每个 track 有 8 个 bar，每个 bar 有 16 个 step
 * 
 * 数据结构:
 * matrix[trackId][barIndex][stepIndex] = cellData
 * 
 * cellData 格式:
 *   - chord track: { note: 'Cmaj7', velocity: 100 } | null
 *   - bass track:  { note: 'C2', velocity: 100 } | null
 *   - perc track:  { note: 'kick', velocity: 100 } | null
 *   - lead track:  { note: 'C4', velocity: 100 } | null
 */

const TOTAL_BARS = 8;
const STEPS_PER_BAR = 16;

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

export { TOTAL_BARS, STEPS_PER_BAR, TRACKS };
export default useMusicStore;
