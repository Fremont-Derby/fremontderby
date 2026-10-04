export function roundDateLine(date) {
  const value = String(date || '').trim();
  return value ? `League night ${value}` : 'Date not set';
}
