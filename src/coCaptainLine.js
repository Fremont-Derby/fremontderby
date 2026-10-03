export function coCaptainLine(name) {
  const value = String(name || '').trim();
  return value ? `Co-captain: ${value}` : 'Co-captain not set';
}
