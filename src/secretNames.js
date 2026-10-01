export const REQUIRED_SECRET_NAMES = ['SESSION_SECRET', 'GITHUB_TOKEN'];

export function secretInventory(present) {
  const names = REQUIRED_SECRET_NAMES.map(name => ({ name, present: present.includes(name) }));
  return { names, missing: names.filter(item => !item.present).map(item => item.name) };
}
