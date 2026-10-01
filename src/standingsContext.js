export function standingsContext({ team, rank, played }) {
  if (!team) return { ok: false, reason: 'Name the team.' };
  if (!Number.isInteger(rank) || rank < 1) return { ok: false, reason: 'Rank is missing.' };
  return { ok: true, team, rank, played: played || 0 };
}
