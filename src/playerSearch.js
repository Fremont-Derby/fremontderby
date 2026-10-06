export function playerSearch(players, query) {
  const wanted = String(query || '').trim().toLowerCase();
  if (!wanted) return players || [];
  return (players || []).filter((player) => String(player.displayName || player.display_name || '').toLowerCase().includes(wanted));
}
