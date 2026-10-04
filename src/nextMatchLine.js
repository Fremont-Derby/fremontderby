export function nextMatchLine(match = {}) {
  if (!match.home || !match.away || !match.date) return '';
  return `Next match: ${match.home} vs ${match.away} on ${match.date}.`;
}
