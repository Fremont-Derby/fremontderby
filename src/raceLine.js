export function raceLine(to) {
  const n = Number(to) || 0;
  return n ? `Race to ${n}` : 'Race not set';
}
