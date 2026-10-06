export function disputeOpen(match) {
  if (!match) return false;
  if (match.winner_team_id || match.winnerTeamId) return true;
  return String(match.status || '') === 'finalized';
}
