export function restampLine(lane) {
  return `${lane || 'This lane'} must not be restamped as production.`;
}
