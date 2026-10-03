export function clientErrorLine(error = {}) {
  if (!error.name) return '';
  return `Client error: ${error.name}.`;
}
export function qualityBaselineLine(run = {}) {
  if (!run.name || run.passed == null) return '';
  return `${run.name} baseline: ${run.passed} passed.`;
}
