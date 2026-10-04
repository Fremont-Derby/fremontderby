export function mismatchLine(score = {}) {
  if (!score.mismatch) return '';
  return 'That score does not match. It was not saved.';
}
export function overrunLine(score = {}) {
  if (!score.overrun) return '';
  return 'Scoring is closed.';
}
