export function refereeLine(name) {
  const value = String(name || '').trim();
  return value ? `Referee: ${value}` : 'Referee not set';
}
