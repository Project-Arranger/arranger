/**
 * @typedef {'intro' | 'perc' | 'chord' | 'lead'} TutorialTrack
 */

/**
 * @typedef {Object} TutorialTarget
 * @property {string} [selector] DOM selector used by TutorialOverlay to highlight the real UI.
 * @property {'chord' | 'bass' | 'perc' | 'lead'} [trackId]
 * @property {number} [bar]
 * @property {number} [step]
 * @property {string} [instrument]
 */

/**
 * @typedef {Object} TutorialCompletion
 * @property {'manual' | 'cell-count' | 'chord-choice' | 'lead-play'} type
 * @property {'chord' | 'bass' | 'perc' | 'lead'} [trackId]
 * @property {number} [bar]
 * @property {number} [step]
 * @property {string} [instrument]
 * @property {number} [minCount]
 * @property {number} [optionIndex]
 * @property {string} [stage]
 */

/**
 * @typedef {Object} TutorialPlayback
 * @property {number[]} bars
 * @property {boolean} autoStart
 */

/**
 * @typedef {Object} TutorialStep
 * @property {string} id
 * @property {TutorialTrack} track
 * @property {string} title
 * @property {string} prompt
 * @property {string} [hint]
 * @property {string} [successMessage]
 * @property {TutorialTarget} [target]
 * @property {TutorialCompletion} completion
 * @property {TutorialPlayback} [playback]
 */

export {};
