export function forkBuild(fromFork) {
  if (fromFork) return 'A public pull request cannot start a lane build.';
  return 'This build is from the lane branch.';
}
