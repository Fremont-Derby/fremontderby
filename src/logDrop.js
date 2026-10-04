export function logDrop(event) {
  return { action: event.action || 'unknown', lane: event.lane || 'unknown' };
}
