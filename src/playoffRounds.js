export function playoffRounds(rounds) {
  return (rounds || []).filter((round) => ['semifinal', 'championship', 'tiebreaker'].includes(String(round?.stage || '')));
}
