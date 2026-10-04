export function shotClockLine(seconds) {
  const n = Number(seconds) || 0;
  return n ? `Shot clock: ${n}s` : 'Shot clock not set';
}
