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

export async function advanceSeasonToChampionshipCommand(
  { seasonId, actorUserId },
  repository,
) {
  if (!repository || typeof repository.advanceSeasonToChampionship !== 'function') {
    throw new Error('Playoff repository is required');
  }

  return repository.advanceSeasonToChampionship({
    seasonId: requireUuidLike(seasonId, 'Season id'),
    actorUserId: requireUuidLike(actorUserId, 'Actor user id'),
  });
}

export async function submitPostseasonLineupCommand(
  { actorUserId, teamMatchId, teamId, playerIds, anchorPlayerId },
  repository,
) {
  if (!repository || typeof repository.submitPostseasonLineup !== 'function') {
    throw new Error('Playoff repository is required');
  }
  if (!Array.isArray(playerIds) || playerIds.length !== 4) {
    throw new Error('Postseason lineup requires exactly four players');
  }
  if (new Set(playerIds).size !== 4) {
    throw new Error('Postseason lineup players must be unique');
  }
  const normalizedPlayerIds = playerIds.map((playerId) => requireUuidLike(playerId, 'Player id'));
  const normalizedAnchor = requireUuidLike(anchorPlayerId, 'Anchor player id');
  if (!normalizedPlayerIds.includes(normalizedAnchor)) {
    throw new Error('Postseason anchor must be selected from the submitted lineup');
  }

  return repository.submitPostseasonLineup({
    actorUserId: requireUuidLike(actorUserId, 'Actor user id'),
    teamMatchId: requireUuidLike(teamMatchId, 'Team match id'),
    teamId: requireUuidLike(teamId, 'Team id'),
    playerIds: normalizedPlayerIds,
    anchorPlayerId: normalizedAnchor,
  });
}
