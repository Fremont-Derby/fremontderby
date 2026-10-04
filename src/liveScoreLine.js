export function liveScoreLine(match = {}) {
  if (match.status !== 'in_progress') return '';
  const home = Number(match.homeRacks);
  const away = Number(match.awayRacks);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return 'Live';
  return `Live ${home}-${away}`;
}
