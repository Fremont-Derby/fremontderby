export function freeAgentLine(playerName, available) {
  const name = String(playerName || '').trim() || 'Player';
  return available ? `${name}: available` : `${name}: unavailable`;
}
