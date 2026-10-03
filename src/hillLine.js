export function hillLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} is on the hill` : '';
}
