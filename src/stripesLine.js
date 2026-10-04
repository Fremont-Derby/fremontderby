export function stripesLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} has stripes` : '';
}
