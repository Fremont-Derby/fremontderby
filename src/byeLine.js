export function byeLine(teamName) {
  const name = String(teamName || '').trim();
  return name ? `${name} has a bye` : '';
}
