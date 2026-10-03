export function raceLine(races) {
  const n = Number(races) || 0;
  if (n < 3 || n > 9) return 'Race not set';
  return `Race to ${n}`;
}
