const APP_COMMAND_TYPES = Object.freeze({
  TRANSPORT_TOGGLE_PLAY: 'transport.togglePlay',
  TRANSPORT_STOP: 'transport.stop',
  TRANSPORT_SEEK: 'transport.seek',
  TUTORIAL_NEXT: 'tutorial.next',
  TUTORIAL_COMPLETE_TASK: 'tutorial.completeTask',
  PERC_TOGGLE: 'perc.toggle',
  CHORD_SELECT_OPTION: 'chord.selectOption',
  CHORD_CONFIRM: 'chord.confirm',
  LEAD_NOTE_ON: 'lead.noteOn',
  LEAD_NOTE_OFF: 'lead.noteOff',
});

/**
 * @typedef {{ type: 'transport.togglePlay' } | { type: 'transport.stop' } | { type: 'transport.seek', bar: number, step: number }} TransportCommand
 */

/**
 * @typedef {{ type: 'tutorial.next' } | { type: 'tutorial.completeTask' }} TutorialCommand
 */

/**
 * @typedef {{ type: 'perc.toggle', bar: number, step: number, instrument: 'kick' | 'snare' | 'hihat' }} PercCommand
 */

/**
 * @typedef {{ type: 'chord.selectOption', optionIndex: number } | { type: 'chord.confirm' }} ChordCommand
 */

/**
 * @typedef {{ type: 'lead.noteOn', note: string } | { type: 'lead.noteOff', note: string }} LeadCommand
 */

/**
 * @typedef {TransportCommand | TutorialCommand | PercCommand | ChordCommand | LeadCommand} AppCommand
 */

const TRANSPORT_COMMAND_TYPES = Object.freeze([
  APP_COMMAND_TYPES.TRANSPORT_TOGGLE_PLAY,
  APP_COMMAND_TYPES.TRANSPORT_STOP,
  APP_COMMAND_TYPES.TRANSPORT_SEEK,
]);

const TUTORIAL_COMMAND_TYPES = Object.freeze([
  APP_COMMAND_TYPES.TUTORIAL_NEXT,
  APP_COMMAND_TYPES.TUTORIAL_COMPLETE_TASK,
]);

const PERC_COMMAND_TYPES = Object.freeze([
  APP_COMMAND_TYPES.PERC_TOGGLE,
]);

const CHORD_COMMAND_TYPES = Object.freeze([
  APP_COMMAND_TYPES.CHORD_SELECT_OPTION,
  APP_COMMAND_TYPES.CHORD_CONFIRM,
]);

const LEAD_COMMAND_TYPES = Object.freeze([
  APP_COMMAND_TYPES.LEAD_NOTE_ON,
  APP_COMMAND_TYPES.LEAD_NOTE_OFF,
]);

export {
  APP_COMMAND_TYPES,
  TRANSPORT_COMMAND_TYPES,
  TUTORIAL_COMMAND_TYPES,
  PERC_COMMAND_TYPES,
  CHORD_COMMAND_TYPES,
  LEAD_COMMAND_TYPES,
};
