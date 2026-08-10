function requireUuidLike(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  return value;
}

export async function startSeasonPlayoffsCommand(
  { seasonId, actorUserId },
  repository,
) {
  if (!repository || typeof repository.startSeasonPlayoffs !== 'function') {
    throw new Error('Playoff repository is required');
  }

  return repository.startSeasonPlayoffs({
    seasonId: requireUuidLike(seasonId, 'Season id'),
    actorUserId: requireUuidLike(actorUserId, 'Actor user id'),
  });
}
