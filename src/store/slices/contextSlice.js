import {
  appendEditorTrack,
  getNextActiveEditorTrackId,
  removeEditorTrack,
} from '../../domain/editorTracks';

function createContextSlice(set) {
  return {
    activeContextTrack: null,
    editorTrackStack: [],
    activeEditorTrackEntryId: null,
    selectedBar: 0,
    selectedChordBlock: null,

    setActiveContextTrack: (trackId) => set({ activeContextTrack: trackId }),
    addEditorTrack: (trackId) => set((state) => {
      const editorTrackStack = appendEditorTrack(state.editorTrackStack, trackId);
      const activeEntry = editorTrackStack[editorTrackStack.length - 1];

      return {
        activeContextTrack: trackId,
        activeEditorTrackEntryId: activeEntry.id,
        editorTrackStack,
      };
    }),
    setActiveEditorTrackEntry: (entryId) => set((state) => {
      const activeEntry = state.editorTrackStack.find(entry => entry.id === entryId);

      return {
        activeContextTrack: activeEntry?.trackId ?? state.activeContextTrack,
        activeEditorTrackEntryId: entryId,
      };
    }),
    removeEditorTrack: (entryId) => set((state) => {
      const activeEditorTrackEntryId = getNextActiveEditorTrackId(
        state.editorTrackStack,
        entryId,
        state.activeEditorTrackEntryId
      );
      const editorTrackStack = removeEditorTrack(state.editorTrackStack, entryId);
      const activeEntry = editorTrackStack.find(entry => entry.id === activeEditorTrackEntryId);

      return {
        activeContextTrack: activeEntry?.trackId ?? null,
        activeEditorTrackEntryId,
        editorTrackStack,
      };
    }),
    setSelectedBar: (barIndex) => set({ selectedBar: barIndex }),
    setSelectedChordBlock: (blockData) => {
      set({ selectedChordBlock: blockData });
      if (blockData) {
        set({ activeContextTrack: 'chord', selectedBar: blockData.barIndex });
      }
    },
  };
}

export default createContextSlice;
