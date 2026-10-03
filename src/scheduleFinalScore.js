export function scheduleFinalScore(match) {
  const home = Number(match?.homeRacks ?? match?.home_racks);
  const away = Number(match?.awayRacks ?? match?.away_racks);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return '';
  if (home + away <= 0) return '';
  return home + '-' + away;
}
