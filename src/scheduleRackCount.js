export function scheduleRackCount(match, races) {
  const tally = { A: 0, B: 0 };
  for (const race of Array.isArray(races) ? races : []) {
    if (race?.winner_side === 'A' || race?.winner_side === 'B') tally[race.winner_side] += 1;
  }
  if (tally.A + tally.B > 0) return tally;
  const status = String(match?.status || '');
  if (!['finalized', 'corrected'].includes(status)) return tally;
  if (match?.winner_team_id && match.winner_team_id === match.team_a_id) return { A: 3, B: 0 };
  if (match?.winner_team_id && match.winner_team_id === match.team_b_id) return { A: 0, B: 3 };
  return tally;
}
