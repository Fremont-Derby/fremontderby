export function masseLine(playerName) {
  const name = String(playerName || '').trim();
  return name ? `${name} played a masse` : '';
}
