export function rosterDropBlocked(seasonStatus, active) {
  return active === false && String(seasonStatus || '') === 'active';
}
