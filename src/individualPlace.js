export function playedPlayers(rows) {
  return (rows || []).filter((row) => Number(row?.matches_played || 0) > 0);
}
