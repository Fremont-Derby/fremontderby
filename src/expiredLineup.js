export function expiredLineupLine(lineup = {}) {
  if (!lineup.expired) return '';
  return 'That lineup expired. The unsaved rack is still here.';
}
