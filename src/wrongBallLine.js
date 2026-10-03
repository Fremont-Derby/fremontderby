export function wrongBallLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} hit the wrong ball` : '';
}
