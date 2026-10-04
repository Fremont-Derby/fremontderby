// Read-only regular-season presentation. Never turn partial race data into a team winner.
export function summarizeQaRegularMatch(rows = []) {
  const slots = new Set(rows.map((row) => row.slotNumber));
  const validShape = rows.length === 3 && slots.size === 3
    && [1, 2, 3].every((slot) => slots.has(slot));
  const finalized = rows.filter((row) => ['finalized', 'corrected'].includes(row.status));
  const validResult = (row) => ['a', 'b'].includes(row.winnerSide)
    && Number.isInteger(row.scoreA) && row.scoreA >= 0
    && Number.isInteger(row.scoreB) && row.scoreB >= 0;
  const complete = validShape && finalized.length === 3 && finalized.every(validResult);
  const winsA = finalized.filter((row) => validResult(row) && row.winnerSide === 'a').length;
  const winsB = finalized.filter((row) => validResult(row) && row.winnerSide === 'b').length;
  return {
    state: complete ? 'complete' : 'incomplete',
    finalizedRaces: finalized.length,
    expectedRaces: 3,
    winsA,
    winsB,
    winnerSide: complete ? (winsA > winsB ? 'a' : 'b') : null,
    // Race wins are shown, not invented season points or standings totals.
    label: complete ? 'Matchup complete' : `${finalized.length} of 3 races finalized`,
  };
}
