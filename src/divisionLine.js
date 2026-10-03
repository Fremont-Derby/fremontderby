export function divisionLine(name) {
  const value = String(name || '').trim();
  return value ? `Division: ${value}` : 'Division not set';
}
