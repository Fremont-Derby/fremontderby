export function lineupTeamsLine(match = {}) {
  if (!match.teamA || !match.teamB) return '';
  return `Lineup: ${match.teamA} and ${match.teamB}.`;
}
