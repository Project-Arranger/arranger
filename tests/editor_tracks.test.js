import assert from 'node:assert/strict';
import {
  appendEditorTrack,
  createEditorTrackEntry,
  getNextActiveEditorTrackId,
  getEditorTrackLabel,
  removeEditorTrack,
} from '../src/domain/editorTracks.js';

const first = createEditorTrackEntry('perc', 0);
const second = createEditorTrackEntry('bass', 1);
const third = createEditorTrackEntry('perc', 2);

assert.equal(first.id, 'editor-track-perc-1');
assert.equal(second.id, 'editor-track-bass-2');
assert.equal(third.id, 'editor-track-perc-3');

const nextStack = appendEditorTrack([first, second], 'perc');

assert.deepEqual(nextStack.map(entry => entry.trackId), ['perc', 'bass', 'perc']);
assert.deepEqual(nextStack.map(entry => entry.id), [
  'editor-track-perc-1',
  'editor-track-bass-2',
  'editor-track-perc-3',
]);
assert.equal(getEditorTrackLabel(first), 'DRUMS 1');
assert.equal(getEditorTrackLabel(second), 'BASS 2');
assert.equal(getEditorTrackLabel(third), 'DRUMS 3');

const removedMiddle = removeEditorTrack([first, second, third], second.id);

assert.deepEqual(removedMiddle.map(entry => entry.id), [
  'editor-track-perc-1',
  'editor-track-perc-3',
]);
assert.equal(getNextActiveEditorTrackId([first, second, third], second.id, second.id), third.id);
assert.equal(getNextActiveEditorTrackId([first, second, third], third.id, third.id), second.id);
assert.equal(getNextActiveEditorTrackId([first, second, third], second.id, first.id), first.id);

console.log('editor track append contract passed');
