export function playerOpen(player) {
  return Boolean(player && (player.playerId || player.id));
}
