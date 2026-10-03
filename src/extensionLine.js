export function extensionLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} took an extension` : '';
}
