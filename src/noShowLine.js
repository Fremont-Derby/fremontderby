export function noShowLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} did not show` : '';
}
