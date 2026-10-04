export function lineupLockLabel(round) {
  return round && round.bothCaptainsSubmitted ? 'Lineup locked' : 'Lineup still open';
}

export function lineupLock(locked){return locked?'Ask an admin before this lineup changes.':'Lineup is open';}
