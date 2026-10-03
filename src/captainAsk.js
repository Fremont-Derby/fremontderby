export function captainAsk(name) {
  if (!name) return 'Ask the captain before this lineup change.';
  return `Ask ${name} before this lineup change.`;
}
