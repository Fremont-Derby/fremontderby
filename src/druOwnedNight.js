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

export function playoffPadName(seed) {
  const tail = String(seed || 'night').slice(-4);
  return `Kite String ${tail}`;
}

export function playoffRacesOpened(slotRows, races, teamAId, teamBId) {
  const sides = new Set((slotRows || []).map((row) => row.team_id));
  if (!sides.has(teamAId) || !sides.has(teamBId)) return { ok: true, text: 'Waiting for the other lineup.' };
  if (Array.isArray(races) && races.length) return { ok: true, text: 'Playoff races are open.' };
  return { ok: false, text: 'Playoff races were not created.' };
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
