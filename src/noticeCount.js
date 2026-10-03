export function noticeCountLine(count) {
  const n = Number(count) || 0;
  if (n === 1) return '1 item needs attention';
  return `${n} items need attention`;
}
