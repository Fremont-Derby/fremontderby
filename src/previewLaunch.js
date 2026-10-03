export function previewPathLine(path = {}) {
  if (path.tester) return '';
  return 'Preview is not the tester path.';
}
export function humanLaunchLine(launch = {}) {
  if (!launch.name) return '';
  return `Launch: ${launch.name}.`;
}
