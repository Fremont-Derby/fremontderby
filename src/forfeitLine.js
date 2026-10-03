export function forfeitLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} forfeited` : '';
}
