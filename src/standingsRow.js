export function standingsRow(row = {}) {
  const team = String(row.teamName || '').trim() || 'Team';
  const rank = Number(row.rank) || 0;
  const points = Number(row.points) || 0;
  return `#${rank} ${team} · ${points} pts`;
}
