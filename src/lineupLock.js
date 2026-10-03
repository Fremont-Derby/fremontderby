export function lineupLockLabel(round) {
  return round && round.bothCaptainsSubmitted ? 'Lineup locked' : 'Lineup still open';
}
