export function solidsLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} has solids` : '';
}
