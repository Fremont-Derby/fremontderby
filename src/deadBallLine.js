export function deadBallLine(ball) {
  const value = String(ball || '').trim();
  return value ? `Dead ball: ${value}` : '';
}
