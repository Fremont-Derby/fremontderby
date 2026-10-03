export function spotLine(games) {
  const n = Number(games) || 0;
  return n ? `Spot: ${n}` : 'Spot not set';
}
