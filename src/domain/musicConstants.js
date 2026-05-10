const TOTAL_BARS = 8;
const STEPS_PER_BAR = 16;
const BEATS_PER_BAR = 4;
const CHORD_SPAN = STEPS_PER_BAR / BEATS_PER_BAR;
const EIGHTH_STEPS_PER_BAR = 8;

const TRACK_IDS = Object.freeze(['chord', 'bass', 'perc', 'lead']);
const PERC_INSTRUMENT_IDS = Object.freeze(['kick', 'snare', 'hihat']);

const DEFAULT_BPM = 120;
const ROOT_KEY = 'C';
const SCALE = 'Ionian';

export {
  TOTAL_BARS,
  STEPS_PER_BAR,
  BEATS_PER_BAR,
  CHORD_SPAN,
  EIGHTH_STEPS_PER_BAR,
  TRACK_IDS,
  PERC_INSTRUMENT_IDS,
  DEFAULT_BPM,
  ROOT_KEY,
  SCALE,
};
