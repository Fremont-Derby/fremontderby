export function winnerLine(teamName) {
  const name = String(teamName || '').trim();
  return name ? `${name} won` : '';
}
