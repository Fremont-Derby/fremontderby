export function breakAndRunLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} broke and ran` : '';
}
