export function scoreStateLabel(match) {
  if (match && match.status === 'finalized') return 'Final score';
  if (match && match.status === 'in_progress') return 'Live score';
  return 'Not scored';
}
