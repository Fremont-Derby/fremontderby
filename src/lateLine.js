export function lateLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} is late` : '';
}
