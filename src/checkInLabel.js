export function checkInLabel(player) {
  if (player && player.status === 'in') return 'Checked in';
  if (player && player.status === 'out') return 'Out';
  return 'Not checked in';
}
