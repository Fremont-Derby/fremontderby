export function isRequestedStanding(name, requested) {
  const target = String(requested || '').trim().toLowerCase();
  if (!target) return false;
  return String(name || '').trim().toLowerCase() === target;
}
