export function checkName(name) {
  if (!name) return 'Name the required check before a merge.';
  return `Required check: ${name}.`;
}
