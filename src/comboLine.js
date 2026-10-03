export function comboLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} made a combo` : '';
}
