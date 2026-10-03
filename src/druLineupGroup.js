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

export function regularSeasonReady(matches) {
  const rows = matches || [];
  return rows.length >= 28 && rows.every((row) => row.status === 'finalized' && row.winner_team_id);
}
