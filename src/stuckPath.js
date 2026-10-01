export function stuckRecovery(step) {
  const paths = { launch: '/mission', lineup: '/lineup', score: '/score' };
  return paths[step] || null;
}
