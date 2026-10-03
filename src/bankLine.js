export function bankLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} banked it` : '';
}
