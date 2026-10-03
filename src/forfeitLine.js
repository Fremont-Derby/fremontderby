export function forfeitLine(teamName) {
  const name = String(teamName || '').trim();
  return name ? `${name} forfeited` : '';
}
