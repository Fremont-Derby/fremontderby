export function membershipSeatOk(status) {
  return status === 200 || status === 201 || status === 204 || status === 409;
}

export function emptyLineupIds(rows) {
  const byLineup = new Map();
  for (const row of rows || []) {
    const id = row.lineup_id || row.id;
    if (!id) continue;
    const list = byLineup.get(id) || [];
    list.push(row);
    byLineup.set(id, list);
  }
  return [...byLineup.entries()]
    .filter(([, slots]) => !slots.some((slot) => slot.player_id || slot.playerId))
    .map(([id]) => id);
}

export function forfeitShouldNotSeal(playerCount, expected) {
  return playerCount > 0 && playerCount < expected;
}
