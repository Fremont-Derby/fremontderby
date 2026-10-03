export function foulLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} fouled` : '';
}
