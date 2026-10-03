export function slopLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} slopped it` : '';
}
