export function eightBallLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} made the eight` : '';
}
