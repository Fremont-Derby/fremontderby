export function homeLineLabel(season) {
  if (!season) return 'When, where, cost, and how to join are missing';
  return [season.playNight, season.venue, season.cost, season.joinOpen ? 'Join is open' : 'Join is closed'].filter(Boolean).join(' · ') || 'Home line is missing';
}
