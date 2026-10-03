export function subLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} is the substitute` : '';
}
