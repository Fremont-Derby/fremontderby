export function lineupLockLine(submittedCount) {
  return submittedCount >= 2 ? 'Lineup locked' : 'Editable until both captains submit';
}
