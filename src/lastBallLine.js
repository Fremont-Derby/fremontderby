export function lastBallLine(ball) {
  const value = String(ball || '').trim();
  return value ? `Last ball: ${value}` : 'Last ball not set';
}
