export function tradeStatusLine(playerName, accepted) {
  const name = String(playerName || '').trim() || 'Player';
  return accepted ? `${name}: accepted` : `${name}: open`;
}
