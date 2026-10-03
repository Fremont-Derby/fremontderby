export function kickLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} kicked it` : '';
}
