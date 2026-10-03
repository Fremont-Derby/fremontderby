export function raceFinished(row) {
  if (!row) return false;
  if (['finalized', 'corrected'].includes(row.status) && ['A', 'B'].includes(row.winner_side)) return true;
  return ['A', 'B'].includes(row.match_winner_side);
}

export function championshipLine(match) {
  if (!match || match.stage !== 'championship' || match.status !== 'finalized') return '';
  const winnerId = match.winnerTeamId || match.winner_team_id;
  const name = winnerId && winnerId === (match.teamAId || match.team_a_id)
    ? match.teamAName || match.team_a_name
    : winnerId && winnerId === (match.teamBId || match.team_b_id)
      ? match.teamBName || match.team_b_name
      : match.winnerName || '';
  return name ? `${name} won the championship.` : '';
}
