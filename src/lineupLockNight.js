export function lineupLockNight(count) {
  if (count < 3) return 'Lineup needs three players before it can lock.';
  return 'Three players can lock this lineup.';
}
