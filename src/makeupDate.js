export function makeupDateLine(date) {
  const value = String(date || '').trim();
  return value ? `Makeup ${value}` : '';
}
