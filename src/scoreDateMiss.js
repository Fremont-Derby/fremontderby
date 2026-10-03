export function scoreDateMiss(match = {}) {
  if (match.found) return '';
  return 'That date is not on this score list.';
}
export function lineupBothTeams(match = {}) {
  if (!match.home || !match.away) return '';
  return `${match.home} vs ${match.away}.`;
}
