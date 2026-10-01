export function seasonsForRequestedMatch(seasons = [], explicitSeasonId = '') {
  const rows = Array.isArray(seasons) ? seasons : [];
  const requested = String(explicitSeasonId || '');
  const first = rows.filter((season) => season.id === requested);
  const rest = rows.filter((season) => season.id !== requested);
  return [...first, ...rest];
}

export function scorecardMatchLabel(match = {}, round = {}) {
  const home = match.teamAName || 'Home';
  const away = match.teamBName || 'Away';
  const week = round.roundNumber || '';
  return `${home} vs ${away} · Round ${week}`;
}
