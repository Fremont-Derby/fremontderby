export function startTimeLine(time) {
  const value = String(time || '').trim();
  return value ? `Starts ${value}` : 'Start time not set';
}
