export function weekLine(week) {
  const n = Number(week) || 0;
  return n ? `Week ${n}` : 'Week not set';
}
