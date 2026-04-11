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
 */

const TOTAL_BARS = 8;
const STEPS_PER_BAR = 16;
const TOTAL_STEPS = TOTAL_BARS * STEPS_PER_BAR; // 128

class AudioEngine {
  constructor() {
    this._sequence = null;
    this._isInitialized = false;
    this._currentGlobalStep = 0;
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

    // 创建 Sequence: 128 个 step, 每个 step 是 16n (十六分音符)
    const steps = Array.from({ length: TOTAL_STEPS }, (_, i) => i);

    this._sequence = new Tone.Sequence(
      (time, globalStep) => {
        this._onStep(time, globalStep);
      },
      steps,
      '16n'
    );

    // 设置循环
    this._sequence.loop = true;
    this._sequence.loopStart = 0;
    this._sequence.loopEnd = TOTAL_STEPS;

    this._isInitialized = true;
    console.log('[AudioEngine] Initialized. Ready to play.');
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

    // ---- 未来在此触发各轨道音频 ----
    // const { matrix } = useMusicStore.getState();
    // TRACKS.forEach(trackId => {
    //   const cellData = matrix[trackId]?.[bar]?.[step];
    //   if (cellData) { ... trigger sound ... }
    // });
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
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this._isInitialized = false;
    console.log('[AudioEngine] Disposed');
  }
}

// 单例模式 —— 全局只有一个 AudioEngine
const audioEngine = new AudioEngine();

export default audioEngine;
