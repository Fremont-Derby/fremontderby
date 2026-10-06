export function scoreLinkMiss(list, requested) {
  if (!requested) return '';
  const ids = new Set((list || []).map((item) => String(item.teamMatchId || item.team_match_id || item.id || '')));
  if (ids.has(String(requested))) return '';
  return 'Lock the lineup, then come back to score this match.';
}
