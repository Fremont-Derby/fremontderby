export function teamSummaryLabel(team) {
  if (!team || !team.teamName) return 'No team selected';
  return team.teamName + ' · ' + (team.captainName || 'no captain');
}
