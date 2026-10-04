export function nineBallLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} made the nine` : '';
}
