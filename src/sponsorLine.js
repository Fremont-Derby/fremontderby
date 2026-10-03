export function sponsorLine(name) {
  const value = String(name || '').trim();
  return value ? `Sponsor: ${value}` : 'Sponsor not set';
}
