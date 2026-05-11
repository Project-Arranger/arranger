const EDITOR_TRACK_LABELS = Object.freeze({
  chord: 'CHORD',
  bass: 'BASS',
  perc: 'DRUMS',
  lead: 'LEAD',
});

function createEditorTrackEntry(trackId, index) {
  return {
    id: `editor-track-${trackId}-${index + 1}`,
    trackId,
    order: index + 1,
  };
}

function appendEditorTrack(stack, trackId) {
  return [...stack, createEditorTrackEntry(trackId, stack.length)];
}

function removeEditorTrack(stack, entryId) {
  return stack.filter(entry => entry.id !== entryId);
}

function getNextActiveEditorTrackId(stack, removedEntryId, activeEntryId) {
  if (activeEntryId && activeEntryId !== removedEntryId) {
    return activeEntryId;
  }

  const removedIndex = stack.findIndex(entry => entry.id === removedEntryId);
  const nextStack = removeEditorTrack(stack, removedEntryId);

  if (nextStack.length === 0) {
    return null;
  }

  const fallbackIndex = removedIndex < 0
    ? nextStack.length - 1
    : Math.min(removedIndex, nextStack.length - 1);

  return nextStack[fallbackIndex].id;
}

function getEditorTrackLabel(entry) {
  const label = EDITOR_TRACK_LABELS[entry.trackId] ?? entry.trackId.toUpperCase();
  return `${label} ${entry.order}`;
}

export {
  EDITOR_TRACK_LABELS,
  appendEditorTrack,
  createEditorTrackEntry,
  getNextActiveEditorTrackId,
  getEditorTrackLabel,
  removeEditorTrack,
};
