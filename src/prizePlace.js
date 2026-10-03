export function prizePlaceLine(place, teamName) {
  const team = String(teamName || '').trim() || 'Team';
  const n = Number(place) || 0;
  return n ? `Place ${n}: ${team}` : team;
}
