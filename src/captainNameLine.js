export function captainNameLine(name) {
  const value = String(name || '').trim();
  return value ? `Captain: ${value}` : 'Captain not set';
}
