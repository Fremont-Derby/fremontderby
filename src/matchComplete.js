export function matchCompleteLine(match = {}) {
  const done = ['finalized', 'corrected'].includes(match.status);
  return { done, line: done ? 'Match complete' : '', hideAddRack: done };
}
