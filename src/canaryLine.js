export function canaryLine(ok) {
  if (!ok) return 'The public page did not answer. Check the lane, then try the page again.';
  return 'The public page answered.';
}
