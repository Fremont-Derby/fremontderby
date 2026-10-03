export function playerIdentity(name) {
  if (!name) return 'Name the player before this mission starts.';
  return `This mission is for ${name}.`;
}
