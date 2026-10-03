export function checkinStatusWord(status) {
  if (status === 'in') return 'In';
  if (status === 'out') return 'Out';
  if (status === 'maybe') return 'Maybe';
  return 'Not marked';
}
