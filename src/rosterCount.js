export function rosterCountLine(teamName, count) {
  const name = String(teamName || '').trim() || 'Team';
  const n = Number(count) || 0;
  return `${name}: ${n} player${n === 1 ? '' : 's'}`;
}
