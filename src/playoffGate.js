export function playoffGate(weeksDone) {
  if (!weeksDone) return 'Finish the weeks before playoffs.';
  return 'Playoffs can start.';
}
