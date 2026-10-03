export function seasonNameLine(name) {
  const value = String(name || '').trim();
  return value ? `Season: ${value}` : 'Season not selected';
}
