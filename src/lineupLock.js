export function lineupLock(locked) {
  if (locked) return 'This lineup is locked. Ask an admin to change it.';
  return 'This lineup can still change.';
}
