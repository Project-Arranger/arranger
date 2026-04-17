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
    this._padReverb = null;
    this._bass = null;
    this._reverb = null;
    this._bassFilter = null;
    this._drums = null;
    this._leadEpiano = null;
  }

  /**
   * 初始化音频上下文（必须由用户交互触发）
   * Web Audio API 要求首次 start 在用户手势中
   */
  async init() {
    if (this._isInitialized) return;

    await Tone.start();
    console.log('[AudioEngine] Tone.js AudioContext started');

    const { bpm, volumes } = useMusicStore.getState();
    Tone.getTransport().bpm.value = bpm;

    // ---- 创建 Chord Sampler（用户录制的 A4~G4 真实采样）----
    this._padReverb = new Tone.Reverb({
      decay: 3.5,
      wet: 0.4,
    }).toDestination();

    const chordBaseUrl = `${import.meta.env.BASE_URL}samples/chords/`;
    this._epiano = await new Promise((resolve, reject) => {
      const s = new Tone.Sampler({
        urls: {
          A4: 'A4.wav',
          B4: 'B4.wav',
          C4: 'C4.wav',
          D4: 'D4.wav',
          E4: 'E4.wav',
          F4: 'F4.wav',
          G4: 'G4.wav',
        },
        baseUrl: chordBaseUrl,
        release: 2.0,
        onload: () => resolve(s),
        onerror: (err) => {
          console.warn('[AudioEngine] Chord sampler load failed, falling back to synth', err);
          resolve(null);
        },
      });
      s.connect(this._padReverb);
    });

    if (!this._epiano) {
      // Fallback: 若采样加载失败，用软 FM Pad 保底
      this._epiano = new Tone.PolySynth(Tone.FMSynth, {
        maxPolyphony: 12,
        options: {
          harmonicity: 1.0, modulationIndex: 0.15,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.15, decay: 0.8, sustain: 0.75, release: 3.0 },
          modulation: { type: 'sine' },
          modulationEnvelope: { attack: 0.2, decay: 0.8, sustain: 0.2, release: 1.5 },
        },
      });
      this._epiano.connect(this._padReverb);
    }
    this._epiano.volume.value = -10 + (volumes.chord || 0);

    // ---- 创建 Bass Sampler（用户录制的采样 C1~G1 + A0~B0）----
    this._bassFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 400,
      rolloff: -24,
    }).toDestination();

    const bassBaseUrl = `${import.meta.env.BASE_URL}samples/bass/`;
    this._bass = await new Promise((resolve, reject) => {
      const s = new Tone.Sampler({
        urls: {
          C1: 'Bass_C1.wav',
          D1: 'Bass_D1.wav',
          E1: 'Bass_E1.wav',
          F1: 'Bass_F1.wav',
          G1: 'Bass_G1.wav',
          A0: 'Bass_A0.wav',
          B0: 'Bass_B0.wav',
        },
        baseUrl: bassBaseUrl,
        release: 0.3,
        onload: () => resolve(s),
        onerror: (err) => {
          console.warn('[AudioEngine] Bass sampler load failed, falling back to synth', err);
          resolve(null);
        },
      });
      s.connect(this._bassFilter);
    });

    if (!this._bass) {
      // Fallback: 若采样加载失败，用合成器保底
      this._bass = new Tone.MonoSynth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.1 },
        filterEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.1, baseFrequency: 80, octaves: 3 },
      });
      this._bass.connect(this._bassFilter);
    }
    this._bass.volume.value = -4 + (volumes.bass || 0);

    // ---- 创建 Lead Sampler（用户录制的采样 C3~B3）----
    this._reverb = new Tone.Reverb({
      decay: 2.0,
      wet: 0.28,
    }).toDestination();

    const leadBaseUrl = `${import.meta.env.BASE_URL}samples/lead/`;
    this._leadEpiano = await new Promise((resolve, reject) => {
      const s = new Tone.Sampler({
        urls: {
          C3: 'Lead%20C3.wav',
          D3: 'Lead%20D3.wav',
          E3: 'Lead%20E3.wav',
          F3: 'Lead%20F3.wav',
          G3: 'Lead%20G3.wav',
          A3: 'Lead%20A3.wav',
          B3: 'Lead%20B3.wav',
        },
        baseUrl: leadBaseUrl,
        release: 1.0,
        onload: () => resolve(s),
        onerror: (err) => {
          console.warn('[AudioEngine] Lead sampler load failed, falling back to synth', err);
          resolve(null);
        },
      });
      s.connect(this._reverb);
    });

    if (!this._leadEpiano) {
      // Fallback: 若采样加载失败，用 FM 合成器保底
      this._leadEpiano = new Tone.PolySynth(Tone.FMSynth, {
        maxPolyphony: 4,
        options: {
          harmonicity: 2.5, modulationIndex: 1.2,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.8 },
        },
      });
      this._leadEpiano.connect(this._reverb);
    }
    this._leadEpiano.volume.value = -6 + (volumes.lead || 0);

    // ---- 创建 Percussion 音色 (808 Sampler) ----
    // 必须与 Vite `base`（GitHub Pages 项目站为 /repo-name/）一致，否则采样 404 会导致 init 失败、全站无声
    const percBaseUrl = `${import.meta.env.BASE_URL}samples/808/`;
    try {
      await new Promise((resolve, reject) => {
        this._sampler = new Tone.Sampler({
          urls: {
            C1: 'kick.wav',
            D1: 'snare.wav',
            E1: 'hihat.wav',
            F1: 'tom.wav',
            G1: 'clap.wav',
          },
          baseUrl: percBaseUrl,
          onload: resolve,
          onerror: reject,
        }).toDestination();
      });
      this._sampler.volume.value = -2 + (volumes.perc || 0);
    } catch (e) {
      console.warn('[AudioEngine] 808 samples failed to load; percussion disabled.', e);
      this._sampler = null;
    }

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
      // '2n' 半音符时值 — 让和声像 Pad 一样填满拍子
      this._epiano.triggerAttackRelease(chordCell.notes, '2n', time, 0.65);
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

    // ---- 触发 lead 轨道 ----
    const leadCell = matrix.lead?.[bar]?.[step];
    if (leadCell && leadCell.note) {
      this._leadEpiano.triggerAttackRelease(leadCell.note, '16n', time, 0.85);
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
    this._epiano.triggerAttackRelease(notes, '4n', Tone.immediate(), 0.8);
    console.log(`[AudioEngine] Preview: ${notes.join(', ')}`);
  }

  /**
   * 即时播放一个 bass 音符（用于矩阵点击反馈）
   * @param {string} note - 如 'C2'
   */
  async playBassPreview(note) {
    if (!this._isInitialized) {
      await this.init();
    }
    this._bass.triggerAttackRelease(note, '16n', Tone.immediate(), 0.9);
    console.log(`[AudioEngine] Bass preview: ${note}`);
  }

  /**
   * 即时播放鼓声（用于矩阵点击反馈）
   */
  async playPercPreview(instrument) {
    if (!this._isInitialized) {
      await this.init();
    }
    this._triggerPercInstance(instrument, Tone.immediate());
    console.log(`[AudioEngine] Perc preview: ${instrument}`);
  }

  /**
   * 即时播放一个 lead 音符（用于矩阵点击反馈）
   * @param {string} note - 如 'C4'
   */
  async playLeadPreview(note) {
    if (!this._isInitialized) {
      await this.init();
    }
    this._leadEpiano.triggerAttackRelease(note, '16n', Tone.immediate(), 0.85);
    console.log(`[AudioEngine] Lead preview: ${note}`);
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
   * 跳转到指定位置 (Seek)
   * @param {number} bar - 0~7
   * @param {number} step - 0~15
   */
  async seekToStep(bar, step) {
    if (!this._isInitialized) {
      await this.init();
    }
    const globalStep = bar * STEPS_PER_BAR + step;
    this._currentGlobalStep = globalStep;

    // 更新 Tone.Transport 内部时间戳与 Sequence 进度
    // Tone.Sequence 的进度对应 seconds。16n 的时值取决于 BPM
    const secondsPerStep = Tone.Time('16n').toSeconds();
    const targetSeconds = globalStep * secondsPerStep;

    // 跳转 Transport 并同步更新 Sequence 内部指针
    Tone.getTransport().seconds = targetSeconds;
    
    // 同步 Zustand store 的 UI 状态
    useMusicStore.getState().setPosition(bar, step);
    
    console.log(`[AudioEngine] ⏩ Seek to ${bar + 1}:${step + 1} (${globalStep} steps)`);
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

  setTrackVolume(trackId, volumeDb) {
    if (!this._isInitialized) return;
    
    // Define base mix offsets so the UI slider '0' sounds balanced
    const BASE_OFFSETS = {
      chord: -10,
      bass: -4,
      perc: -2,
      lead: -6,
    };

    const targetVol = BASE_OFFSETS[trackId] + volumeDb;

    switch (trackId) {
      case 'chord':
        if (this._epiano) this._epiano.volume.rampTo(targetVol, 0.1);
        break;
      case 'bass':
        if (this._bass) this._bass.volume.rampTo(targetVol, 0.1);
        break;
      case 'perc':
        if (this._sampler) this._sampler.volume.rampTo(targetVol, 0.1);
        break;
      case 'lead':
        if (this._leadEpiano) this._leadEpiano.volume.rampTo(targetVol, 0.1);
        break;
    }
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
    if (this._padReverb) {
      this._padReverb.dispose();
      this._padReverb = null;
    }
    if (this._reverb) {
      this._reverb.dispose();
      this._reverb = null;
    }
    if (this._sampler) {
      this._sampler.dispose();
      this._sampler = null;
    }
    if (this._leadEpiano) {
      this._leadEpiano.dispose();
      this._leadEpiano = null;
    }
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this._isInitialized = false;
    console.log('[AudioEngine] Disposed');
  }
  async exportWav() {
    if (!this._isInitialized) {
      await this.init();
    }
    
    // 强制暂停当前播放，防止干扰
    this.pause();

    const store = useMusicStore.getState();
    const { bpm, matrix, volumes } = store;
    
    // 计算总时长：8小节 = 32拍。
    const secondsPerBeat = 60 / bpm;
    const songDuration = TOTAL_BARS * 4 * secondsPerBeat;
    const renderDuration = songDuration + 4.0; // 留出 4 秒尾音(reverb tail)

    console.log(`[AudioEngine] Start offline rendering... Duration: ${renderDuration.toFixed(2)}s`);

    // 使用 Tone.Offline 离线极速渲染引擎
    const renderBuffer = await Tone.Offline(async ({ transport }) => {
      // 离线环境的时钟也需要同步
      transport.bpm.value = bpm;

      // 重新在离线 Context 内构建音源
      const reverb = new Tone.Reverb({ decay: 2.0, wet: 0.28 }).toDestination();
      const padReverb = new Tone.Reverb({ decay: 3.5, wet: 0.4 }).toDestination();
      const percBaseUrlOffline = `${import.meta.env.BASE_URL}samples/chords/`;
      const epiano = await new Promise((resolve) => {
        const s = new Tone.Sampler({
          urls: {
            A4: 'A4.wav', B4: 'B4.wav', C4: 'C4.wav',
            D4: 'D4.wav', E4: 'E4.wav', F4: 'F4.wav', G4: 'G4.wav',
          },
          baseUrl: percBaseUrlOffline,
          release: 2.0,
          onload: () => resolve(s),
          onerror: () => resolve(null),
        });
        s.connect(padReverb);
      });
      if (epiano) epiano.volume.value = -10 + (volumes.chord || 0);

      const bassFilter = new Tone.Filter({ type: 'lowpass', frequency: 400, rolloff: -24 }).toDestination();
      const bassBaseUrlOffline = `${import.meta.env.BASE_URL}samples/bass/`;
      const bass = await new Promise((resolve) => {
        const s = new Tone.Sampler({
          urls: {
            C1: 'Bass_C1.wav', D1: 'Bass_D1.wav', E1: 'Bass_E1.wav',
            F1: 'Bass_F1.wav', G1: 'Bass_G1.wav', A0: 'Bass_A0.wav', B0: 'Bass_B0.wav',
          },
          baseUrl: bassBaseUrlOffline,
          release: 0.3,
          onload: () => resolve(s),
          onerror: () => resolve(null),
        });
        s.connect(bassFilter);
      });
      if (bass) bass.volume.value = -4 + (volumes.bass || 0);

      const leadBaseUrlOffline = `${import.meta.env.BASE_URL}samples/lead/`;
      const leadEpiano = await new Promise((resolve) => {
        const s = new Tone.Sampler({
          urls: {
            C3: 'Lead%20C3.wav', D3: 'Lead%20D3.wav', E3: 'Lead%20E3.wav',
            F3: 'Lead%20F3.wav', G3: 'Lead%20G3.wav', A3: 'Lead%20A3.wav', B3: 'Lead%20B3.wav',
          },
          baseUrl: leadBaseUrlOffline,
          release: 1.0,
          onload: () => resolve(s),
          onerror: () => resolve(null),
        });
        s.connect(reverb);
      });
      if (leadEpiano) leadEpiano.volume.value = -6 + (volumes.lead || 0);

      // 加载打击乐采样
      const percBaseUrl = `${import.meta.env.BASE_URL}samples/808/`;
      let sampler = null;
      try {
        sampler = await new Promise((resolve, reject) => {
          const s = new Tone.Sampler({
            urls: { C1: 'kick.wav', D1: 'snare.wav', E1: 'hihat.wav', F1: 'tom.wav', G1: 'clap.wav' },
            baseUrl: percBaseUrl,
            onload: () => resolve(s),
            onerror: reject
          }).toDestination();
        });
        sampler.volume.value = -2 + (volumes.perc || 0);
      } catch (e) {
        console.warn('[Offline Engine] Sampler load failed', e);
      }

      // 获取当前离线环境的 16分音符步长
      const secondsPerStep = Tone.Time('16n').toSeconds();

      // 一口气把所有矩阵里的音符都丢进离线时间轴
      for (let globalStep = 0; globalStep < TOTAL_STEPS; globalStep++) {
        const bar = Math.floor(globalStep / STEPS_PER_BAR);
        const step = globalStep % STEPS_PER_BAR;
        const time = globalStep * secondsPerStep;

        // CHORD
        const chordCell = matrix.chord?.[bar]?.[step];
        if (chordCell && chordCell.notes) epiano.triggerAttackRelease(chordCell.notes, '2n', time, 0.65);

        // BASS
        const bassCell = matrix.bass?.[bar]?.[step];
        if (bassCell && bassCell.note) bass.triggerAttackRelease(bassCell.note, '16n', time, 0.9);

        // PERC
        const percCell = matrix.perc?.[bar]?.[step];
        if (percCell && percCell.instruments && sampler) {
          const m = {'kick':'C1', 'snare':'D1', 'hihat':'E1', 'tom':'F1', 'clap':'G1'};
          percCell.instruments.forEach(inst => sampler.triggerAttack(m[inst], time));
        }

        // LEAD
        const leadCell = matrix.lead?.[bar]?.[step];
        if (leadCell && leadCell.note) leadEpiano.triggerAttackRelease(leadCell.note, '16n', time, 0.85);
      }
    }, renderDuration);

    console.log('[AudioEngine] Rendering finished. Encoding to WAV...');

    // 将 ToneAudioBuffer 转成浏览器可直接下载的 WAV Blob
    const wavBlob = audioBufferToWav(renderBuffer.get());
    return wavBlob;
  }
}

// === AudioBuffer 转 WAV 编码器 ===
function audioBufferToWav(buffer, opt) {
  opt = opt || {};
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = opt.float32 ? 3 : 1;
  const bitDepth = format === 3 ? 32 : 16;
  let result;
  
  if (numChannels === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }
  return encodeWAV(result, numChannels, sampleRate, format, bitDepth);
}

function interleave(inputL, inputR) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0, inputIndex = 0;
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function encodeWAV(samples, numChannels, sampleRate, format, bitDepth) {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);
  
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);
  
  if (format === 1) { // PCM (16-bit float to int)
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  } else {
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 4) {
      view.setFloat32(offset, samples[i], true);
    }
  }
  
  return new Blob([view], { type: 'audio/wav' });
}
const audioEngine = new AudioEngine();

export default audioEngine;
