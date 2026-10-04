export function breakLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} breaks` : 'Break not set';
}
