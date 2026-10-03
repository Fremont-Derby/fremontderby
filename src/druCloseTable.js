export function raceFinished(row) {
  if (!row) return false;
  if (['finalized', 'corrected'].includes(row.status) && ['A', 'B'].includes(row.winner_side)) return true;
  return ['A', 'B'].includes(row.match_winner_side);
}

export function scorecardStatus(row) {
  return raceFinished(row) ? 'finalized' : (row?.status || 'scheduled');
}

export function playoffMatches(rounds) {
  return (rounds || [])
    .filter((round) => ['semifinal', 'final', 'championship', 'playoff'].includes(round.stage))
    .flatMap((round) => (round.matches || []).map((match) => ({
      stage: round.stage,
      teams: [match.teamAName || match.team_a_name, match.teamBName || match.team_b_name],
      status: match.status,
    })));
}
