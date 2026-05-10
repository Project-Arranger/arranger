const TUTORIAL_STEP_IDS = Object.freeze({
  INTRO: 'intro-start',
  UI_OVERVIEW: 'intro-ui-overview',
  PERC_KICK: 'perc-kick-1',
  PERC_SNARE: 'perc-snare-2',
  PERC_HIHAT: 'perc-hihat-3',
  PERC_GROOVE: 'perc-groove-4',
  CHORD_TEMPLATE: 'chord-template',
  CHORD_COLOR: 'chord-color',
  CHORD_PASSING: 'chord-passing',
  CHORD_TENSION: 'chord-tension-release',
  LEAD_PERFORMANCE: 'lead-performance',
  COMPLETE: 'tutorial-complete',
});

const TUTORIAL_STEP_ORDER = Object.freeze(Object.values(TUTORIAL_STEP_IDS));

export { TUTORIAL_STEP_IDS, TUTORIAL_STEP_ORDER };
