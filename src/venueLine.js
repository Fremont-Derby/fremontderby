export function venueLine(name) {
  const value = String(name || '').trim();
  return value ? `Venue: ${value}` : 'Venue not set';
}
