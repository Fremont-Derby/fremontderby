export function testerPath(path) {
  if (path === '/test-drive' || path === '/fixture-preview') return '/mission';
  return path;
}
