export function dryBreakLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} dry broke` : '';
}
