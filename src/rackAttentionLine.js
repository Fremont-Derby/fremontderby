export function rackAttentionLine(count) {
  const n = Number(count) || 0;
  if (n === 1) return '1 rack needs attention.';
  if (n > 1) return `${n} racks need attention.`;
  return '';
}
