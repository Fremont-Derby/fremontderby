export function roundStatusLabel(round) {
  return round && round.roundNumber ? 'Round ' + round.roundNumber : 'Round is not set';
}
