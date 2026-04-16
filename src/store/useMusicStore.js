import { create } from 'zustand';
import { CHORD_LIBRARY } from '../data/chords';
import { eighthToStep } from '../data/bassNotes';

/** 和弦 ID → Bass 根音映射（跨越所有内置和弦）*/
const CHORD_TO_BASS_ROOT = {
  'C':       'C2',
  'Am':      'A2',
  'F':       'F2',
  'G':       'G2',
  'Cmaj7':   'C2',
  'Cmaj9':   'C2',
  'Cadd9':   'C2',
  'Am7':     'A2',
  'Am9':     'A2',
  'Am(add9)':'A2',
  'Fmaj7':   'F2',
  'F6':      'F2',
  'Fadd9':   'F2',
  'G7':      'G2',
  'G9':      'G2',
  'Gsus4':   'G2',
  'Em/B':    'B2',
  'F#m7b5':  'F#2',
  'G/B':     'B2',
  'E7':      'E2',
  'Fm':      'F2',
  'C/E':     'E2',
  'Abdim':   'G#2',
  'D/F#':    'F#2',
};

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
  rootKey: 'C',
  scale: 'Ionian',

  // 用户手动点击定位的小节（与 currentBar 引擎播放位置分离）
  seekBar: 0,
  seekBeat: 0, // 小节内的拍子 (0-3)

  // 当前播放位置 (0-indexed)
  currentBar: 0,
  currentStep: 0,

  // -------- Context Area 状态 --------
  /** 当前显示详情编辑器的轨道 ('bass' | 'chord' | 'perc' | null) */
  activeContextTrack: null,
  /** 当前正在编辑的小节 index (0~7) */
  selectedBar: 0,
  /** 选中的 Chord 实例（为了变体呼出）: { barIndex, stepIndex, baseChordId } */
  selectedChordBlock: null,

  // -------- Playhead Scrubbing 状态 --------
  /** 用户拖拽进度时的虚拟进度 [0.0 ~ 1.0]，如果为 null 则显示真实进度 */
  dragProgress: null,

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

  setRootKey: (key) => set({ rootKey: key }),
  setScale: (scale) => set({ scale: scale }),
  setSeekBar: (barIndex) => set({ seekBar: barIndex }),
  setSeekPosition: (barIndex, beatIndex) => set({ seekBar: barIndex, seekBeat: beatIndex }),

  /**
   * 更新当前播放位置（由 AudioEngine 调用）
   */
  setPosition: (bar, step) => set({ currentBar: bar, currentStep: step }),

  /**
   * 设置用户的拖拽视窗进度（挂起实际的引擎定位）
   */
  setDragProgress: (progress) => set({ dragProgress: progress }),

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
   * 移除任意轨道某个位置的数据
   */
  clearStep: (trackId, barIndex, stepIndex) => {
    const { matrix } = get();
    if (!matrix[trackId]) return;
    
    const newBar = [...matrix[trackId][barIndex]];
    newBar[stepIndex] = null;

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
   * 清空整条轨道所有小节的数据
   */
  clearTrack: (trackId) => {
    const { matrix, totalBars, stepsPerBar } = get();
    if (!matrix[trackId]) return;

    const emptyTrack = Array.from({ length: totalBars }, () =>
      Array.from({ length: stepsPerBar }, () => null)
    );

    set({
      matrix: {
        ...matrix,
        [trackId]: emptyTrack,
      },
    });
  },

  // -------- Actions: Context Area --------
  setActiveContextTrack: (trackId) => set({ activeContextTrack: trackId }),
  setSelectedBar: (barIndex) => set({ selectedBar: barIndex }),
  setSelectedChordBlock: (blockData) => {
    set({ selectedChordBlock: blockData });
    if (blockData) {
      set({ activeContextTrack: 'chord', selectedBar: blockData.barIndex });
    }
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
    const { matrix, setChordBlock } = get();
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
   * @param {string} note - 'C4' ~ 'B4'
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
