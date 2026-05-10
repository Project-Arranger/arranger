import {
  DEFAULT_BPM,
  ROOT_KEY,
  SCALE,
  STEPS_PER_BAR,
  TOTAL_BARS,
  TRACK_IDS,
} from '../../domain/musicConstants';

function createTransportSlice(set) {
  return {
    bpm: DEFAULT_BPM,
    isPlaying: false,
    rootKey: ROOT_KEY,
    scale: SCALE,
    seekBar: 0,
    seekBeat: 0,
    currentBar: 0,
    currentStep: 0,
    dragProgress: null,
    totalBars: TOTAL_BARS,
    stepsPerBar: STEPS_PER_BAR,
    tracks: TRACK_IDS,
    volumes: {
      chord: 0,
      bass: 0,
      perc: 0,
      lead: 0,
    },

    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    stop: () => set({ isPlaying: false, currentBar: 0, currentStep: 0 }),

    setBpm: (bpm) => {
      const clamped = Math.max(40, Math.min(300, bpm));
      set({ bpm: clamped });
    },

    setTrackVolume: (trackId, volume) => {
      set((state) => ({
        volumes: {
          ...state.volumes,
          [trackId]: volume,
        },
      }));
    },

    setRootKey: (key) => set({ rootKey: key }),
    setScale: (scale) => set({ scale }),
    setSeekBar: (barIndex) => set({ seekBar: barIndex }),
    setSeekPosition: (barIndex, beatIndex) => set({ seekBar: barIndex, seekBeat: beatIndex }),
    setPosition: (bar, step) => set({ currentBar: bar, currentStep: step }),
    setDragProgress: (progress) => set({ dragProgress: progress }),
  };
}

export default createTransportSlice;
