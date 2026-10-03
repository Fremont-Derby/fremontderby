export function warningLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} has a warning` : '';
}
