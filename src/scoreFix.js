export function scoreFix(match) {
  if (!match) return 'The scores do not match. A captain must fix the rack.';
  return 'The scores match.';
}
