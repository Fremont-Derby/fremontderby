export function levelResultLine(result = {}) {
  if (!result.level) return '';
  const state = result.complete ? 'complete' : 'not complete';
  return `${result.level} is ${state}.`;
}
export function stuckPathLine(path = {}) {
  if (!path.name) return '';
  return path.stuck ? `Stuck on ${path.name}. Start again.` : `${path.name} is ready.`;
}
