export function callShotLine(ball) {
  const value = String(ball || '').trim();
  return value ? `Called ${value}` : 'Shot not called';
}
