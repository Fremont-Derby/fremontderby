export function caromLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} made a carom` : '';
}
