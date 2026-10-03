export function publicSurfaceFailure(check = {}) {
  if (check.ok) return '';
  const name = check.name || 'public surface';
  const code = check.status || 'failed';
  return `${name} returned ${code}.`;
}
