export function lineupTeamNames(home, away) {
  const a = String(home || '').trim();
  const b = String(away || '').trim();
  if (!a || !b) return '';
  return a + ' vs ' + b;
}
