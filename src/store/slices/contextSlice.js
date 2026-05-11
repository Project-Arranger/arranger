function createContextSlice(set) {
  return {
    activeContextTrack: 'perc',
    selectedBar: 0,
    selectedChordBlock: null,

    setActiveContextTrack: (trackId) => set({ activeContextTrack: trackId }),
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
