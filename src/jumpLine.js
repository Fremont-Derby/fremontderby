export function jumpLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} jumped it` : '';
}
