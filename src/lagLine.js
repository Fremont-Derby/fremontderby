export function lagLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} won the lag` : 'Lag not set';
}
