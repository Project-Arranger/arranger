import * as Tone from 'tone';
import useMusicStore from '../store/useMusicStore';

/**
 * AudioEngine - 基于 Tone.js 的全局音频引擎
 *
 * 职责:
 * 1. 管理 Tone.Transport 全局时钟
 * 2. 使用 Tone.Sequence 精确调度 step 回调
 * 3. 将当前 bar:step 同步到 Zustand store
 * 4. 控制台实时打印 Bar:Step（1-indexed，如 1:1, 1:2...）
 * 5. 提供 EPiano 音色，支持即时播放和弦
 */

const TOTAL_BARS = 8;
const STEPS_PER_BAR = 16;
const TOTAL_STEPS = TOTAL_BARS * STEPS_PER_BAR; // 128

class AudioEngine {
  constructor() {
    this._sequence = null;
    this._isInitialized = false;
    this._currentGlobalStep = 0;
    this._epiano = null;
    this._bass = null;
    this._reverb = null;
    this._bassFilter = null;
    this._drums = null;
  }

  /**
   * 初始化音频上下文（必须由用户交互触发）
   * Web Audio API 要求首次 start 在用户手势中
   */
  async init() {
    if (this._isInitialized) return;

    await Tone.start();
    console.log('[AudioEngine] Tone.js AudioContext started');

    // 同步 BPM
    const { bpm } = useMusicStore.getState();
    Tone.getTransport().bpm.value = bpm;

    // ---- 创建 EPiano 音色（FM 合成 + Reverb）----
    this._reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.3,
    }).toDestination();

    this._epiano = new Tone.PolySynth(Tone.FMSynth, {
      maxPolyphony: 8,
      voice: Tone.FMSynth,
      options: {
        harmonicity: 3.01,
        modulationIndex: 1.5,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.005,
          decay: 0.6,
          sustain: 0.15,
          release: 1.2,
        },
        modulation: { type: 'square' },
        modulationEnvelope: {
          attack: 0.002,
          decay: 0.3,
          sustain: 0,
          release: 0.5,
        },
      },
    });

    this._epiano.volume.value = -8;
    this._epiano.connect(this._reverb);

    // ---- 创建 Bass 音色（MonoSynth + LowPass）----
    this._bassFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 400,
      rolloff: -24,
    }).toDestination();

    this._bass = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.2,
        sustain: 0.2,
        release: 0.1,
      },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.1,
        release: 0.1,
        baseFrequency: 80,
        octaves: 3,
      },
    });

    this._bass.volume.value = -4;
    this._bass.connect(this._bassFilter);

    // ---- 创建 Percussion 音色 (808 Sampler) ----
    await new Promise((resolve, reject) => {
      this._sampler = new Tone.Sampler({
        urls: {
          'C1': 'kick.wav',
          'D1': 'snare.wav',
          'E1': 'hihat.wav',
          'F1': 'tom.wav',
          'G1': 'clap.wav',
        },
        baseUrl: '/samples/808/',
        onload: resolve,
        onerror: reject,
      }).toDestination();
    });

    this._sampler.volume.value = -2;

    // ---- 创建 Sequence: 128 个 step, 每个 step 是 16n ----
    const steps = Array.from({ length: TOTAL_STEPS }, (_, i) => i);

    this._sequence = new Tone.Sequence(
      (time, globalStep) => {
        this._onStep(time, globalStep);
      },
      steps,
      '16n'
    );

    this._sequence.loop = true;
    this._sequence.loopStart = 0;
    this._sequence.loopEnd = TOTAL_STEPS;

    this._isInitialized = true;
    console.log('[AudioEngine] Initialized with EPiano. Ready to play.');
  }

  /**
   * 每个 step 的回调（由 Tone.Sequence 在 AudioContext 时间精确触发）
   */
  _onStep(time, globalStep) {
    const bar = Math.floor(globalStep / STEPS_PER_BAR);
    const step = globalStep % STEPS_PER_BAR;

    this._currentGlobalStep = globalStep;

    // 在主线程更新 Zustand store（使用 Tone.Draw 确保与渲染同步）
    Tone.getDraw().schedule(() => {
      useMusicStore.getState().setPosition(bar, step);
    }, time);

    // 控制台打印 Bar:Step（1-indexed）
    console.log(`[Clock] ${bar + 1}:${step + 1}`);

    // ---- 触发 chord 轨道 ----
    const { matrix } = useMusicStore.getState();
    const chordCell = matrix.chord?.[bar]?.[step];
    if (chordCell && chordCell.notes) {
      this._epiano.triggerAttackRelease(chordCell.notes, '8n', time, 0.7);
    }

    // ---- 触发 bass 轨道 ----
    const bassCell = matrix.bass?.[bar]?.[step];
    if (bassCell && bassCell.note) {
      this._bass.triggerAttackRelease(bassCell.note, '16n', time, 0.9);
    }

    // ---- 触发 perc 轨道 ----
    const percCell = matrix.perc?.[bar]?.[step];
    if (percCell && percCell.instruments) {
      percCell.instruments.forEach(inst => this._triggerPercInstance(inst, time));
    }
  }

  _triggerPercInstance(instrument, time) {
    if (!this._sampler) return;
    const INST_MAP = {
      'kick': 'C1',
      'snare': 'D1',
      'hihat': 'E1',
      'tom': 'F1',
      'clap': 'G1'
    };
    const note = INST_MAP[instrument];
    if (note) {
      this._sampler.triggerAttack(note, time);
    }
  }

  /**
   * 即时播放一次和弦（用于拖拽放入时的声音反馈）
   * @param {string[]} notes - 如 ['C4', 'E4', 'G4']
   */
  async playChordPreview(notes) {
    if (!this._isInitialized) {
      await this.init();
    }
    this._epiano.triggerAttackRelease(notes, '4n', undefined, 0.8);
    console.log(`[AudioEngine] 🎹 Preview: ${notes.join(', ')}`);
  }

  /**
   * 即时播放一个 bass 音符（用于矩阵点击反馈）
   * @param {string} note - 如 'C2'
   */
  async playBassPreview(note) {
    if (!this._isInitialized) {
      await this.init();
    }
    this._bass.triggerAttackRelease(note, '16n', undefined, 0.9);
    console.log(`[AudioEngine] 🎸 Bass preview: ${note}`);
  }

  /**
   * 即时播放鼓声（用于矩阵点击反馈）
   */
  async playPercPreview(instrument) {
    if (!this._isInitialized) {
      await this.init();
    }
    this._triggerPercInstance(instrument, undefined);
    console.log(`[AudioEngine] 🥁 Perc preview: ${instrument}`);
  }

  /**
   * 播放
   */
  async play() {
    if (!this._isInitialized) {
      await this.init();
    }

    // 同步最新 BPM
    const { bpm } = useMusicStore.getState();
    Tone.getTransport().bpm.value = bpm;

    this._sequence.start(0);
    Tone.getTransport().start();

    useMusicStore.getState().play();
    console.log(`[AudioEngine] ▶ Playing at ${bpm} BPM`);
  }

  /**
   * 暂停（保持当前位置）
   */
  pause() {
    Tone.getTransport().pause();
    useMusicStore.getState().pause();
    console.log('[AudioEngine] ⏸ Paused');
  }

  /**
   * 停止（重置到起点）
   */
  stop() {
    Tone.getTransport().stop();
    if (this._sequence) {
      this._sequence.stop();
    }
    useMusicStore.getState().stop();
    this._currentGlobalStep = 0;
    console.log('[AudioEngine] ■ Stopped');
  }

  /**
   * 更新 BPM（实时生效）
   */
  setBpm(bpm) {
    const clamped = Math.max(40, Math.min(300, bpm));
    Tone.getTransport().bpm.value = clamped;
    useMusicStore.getState().setBpm(clamped);
    console.log(`[AudioEngine] BPM → ${clamped}`);
  }

  /**
   * 获取当前引擎状态
   */
  getStatus() {
    return {
      isInitialized: this._isInitialized,
      transportState: Tone.getTransport().state,
      bpm: Tone.getTransport().bpm.value,
      currentGlobalStep: this._currentGlobalStep,
    };
  }

  /**
   * 销毁（清理资源）
   */
  dispose() {
    if (this._sequence) {
      this._sequence.dispose();
      this._sequence = null;
    }
    if (this._epiano) {
      this._epiano.dispose();
      this._epiano = null;
    }
    if (this._bass) {
      this._bass.dispose();
      this._bass = null;
    }
    if (this._bassFilter) {
      this._bassFilter.dispose();
      this._bassFilter = null;
    }
    if (this._reverb) {
      this._reverb.dispose();
      this._reverb = null;
    }
    if (this._sampler) {
      this._sampler.dispose();
      this._sampler = null;
    }
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this._isInitialized = false;
    console.log('[AudioEngine] Disposed');
  }
}

// 单例模式 —— 全局只有一个 AudioEngine
const audioEngine = new AudioEngine();

export default audioEngine;
