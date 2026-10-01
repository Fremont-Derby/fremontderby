export function eligibilityBadge(row = {}) {
  const minimum = Number(row.minimum_matches) || 0;
  const played =
    Number(row.matches_played) ||
    Number(row.wins || 0) + Number(row.losses || 0) ||
    0;
  const remaining = Math.max(0, minimum - played);
  if (played <= 0) {
    return { label: 'No matches yet', tone: 'muted', qualified: false, playsRemaining: minimum };
  }
  if (remaining === 0 || row.is_prize_eligible) {
    const rank = row.prize_rank == null ? '' : ` #${row.prize_rank}`;
    return { label: `Qualified${rank}`, tone: 'ok', qualified: true, playsRemaining: 0 };
  }
  const plays = remaining === 1 ? 'play' : 'plays';
  return {
    label: `Needs ${remaining} more ${plays}`,
    tone: 'warn',
    qualified: false,
    playsRemaining: remaining,
  };
}
