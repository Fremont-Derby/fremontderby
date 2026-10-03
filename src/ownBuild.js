export function ownBuild(lane) {
  return `${lane || 'This lane'} builds from its own branch. It does not restamp another lane.`;
}
