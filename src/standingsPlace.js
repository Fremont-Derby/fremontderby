export function standingsPlace(row) {
  const played = Number(row?.games_played ?? row?.gamesPlayed ?? 0);
  if (!played) return '';
  const rank = row?.standings_rank ?? row?.standingsRank;
  return rank == null || rank === '' ? '' : String(rank);
}
