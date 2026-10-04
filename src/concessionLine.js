export function concessionLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} conceded` : '';
}
