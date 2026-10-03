export function formatLine(name) {
  const value = String(name || '').trim();
  return value ? `Format: ${value}` : 'Format not set';
}
