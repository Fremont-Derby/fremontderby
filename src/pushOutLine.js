export function pushOutLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} played a push-out` : '';
}
