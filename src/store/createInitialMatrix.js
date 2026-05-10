import { TOTAL_BARS, STEPS_PER_BAR, TRACK_IDS } from '../domain/musicConstants';

function createInitialMatrix() {
  const matrix = {};
  TRACK_IDS.forEach((trackId) => {
    matrix[trackId] = [];
    for (let bar = 0; bar < TOTAL_BARS; bar++) {
      matrix[trackId][bar] = [];
      for (let step = 0; step < STEPS_PER_BAR; step++) {
        matrix[trackId][bar][step] = null;
      }
    }
  });
  return matrix;
}

const createEmptyMatrix = createInitialMatrix;

export { createEmptyMatrix };
export default createInitialMatrix;
