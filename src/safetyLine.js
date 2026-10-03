export function safetyLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} played a safety` : '';
}
