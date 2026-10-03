export function staleSecret({ name, ageDays }) {
  if (!name) return 'Name the override secret before the DRU deploy.';
  if (ageDays > 7) return `${name} is stale. Remove it before the DRU deploy.`;
  return `${name} is current.`;
}
