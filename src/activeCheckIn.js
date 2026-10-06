export function activeSeasonCanCheckIn(seasonStatus, rostered) {
  return String(seasonStatus || '') === 'active' && Boolean(rostered);
}
