export function ballInHandLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} has ball in hand` : '';
}
