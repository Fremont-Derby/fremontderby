export function claimLine(playerName, claimed) {
  const name = String(playerName || '').trim() || 'Player';
  return claimed ? `${name}: claimed` : `${name}: unclaimed`;
}
