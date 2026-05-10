import createInitialMatrix from '../createInitialMatrix';

function createMatrixSlice(set, get) {
  return {
    matrix: createInitialMatrix(),

    setCell: (trackId, barIndex, stepIndex, cellData) => {
      const { matrix } = get();
      const newBar = [...matrix[trackId][barIndex]];
      newBar[stepIndex] = cellData;

      const newTrack = [...matrix[trackId]];
      newTrack[barIndex] = newBar;

      set({
        matrix: {
          ...matrix,
          [trackId]: newTrack,
        },
      });
    },

    clearStep: (trackId, barIndex, stepIndex) => {
      const { matrix } = get();
      if (!matrix[trackId]) return;

      const newBar = [...matrix[trackId][barIndex]];
      newBar[stepIndex] = null;

      const newTrack = [...matrix[trackId]];
      newTrack[barIndex] = newBar;

      set({
        matrix: {
          ...matrix,
          [trackId]: newTrack,
        },
      });
    },

    clearTrack: (trackId) => {
      const { matrix, totalBars, stepsPerBar } = get();
      if (!matrix[trackId]) return;

      const emptyTrack = Array.from({ length: totalBars }, () =>
        Array.from({ length: stepsPerBar }, () => null)
      );

      set({
        matrix: {
          ...matrix,
          [trackId]: emptyTrack,
        },
      });
    },

    clearMatrix: () => set({ matrix: createInitialMatrix() }),
  };
}

export default createMatrixSlice;
