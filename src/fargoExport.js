/**
 * #87 assisted export. Records a finalized match for a later Fargo report.
 * Does not call a provider. Scoring and standings do not depend on this.
 */

export function buildFargoExportRecord(match = {}, prior = null) {
  if (!match.playerMatchId) throw new Error('playerMatchId is required');
  const racks = Array.isArray(match.racks) ? match.racks : [];
  const revision = Number(match.revision || (prior ? Number(prior.revision || 1) + 1 : 1));
  const missingLinks = [match.playerAFargoId, match.playerBFargoId].filter((id) => !id).length;
  const score = racks.reduce(
    (totals, rack) => {
      if (rack.winnerId && rack.winnerId === match.playerAId) totals[0] += 1;
      if (rack.winnerId && rack.winnerId === match.playerBId) totals[1] += 1;
      return totals;
    },
    [0, 0],
  );
  return {
    playerMatchId: String(match.playerMatchId),
    revision,
    idempotencyKey: `${match.playerMatchId}:r${revision}`,
    playerAId: match.playerAId || null,
    playerBId: match.playerBId || null,
    playerAFargoId: match.playerAFargoId || null,
    playerBFargoId: match.playerBFargoId || null,
    playerAName: match.playerAName || null,
    playerBName: match.playerBName || null,
    racks: racks.map((rack, index) => ({
      number: Number(rack.number || index + 1),
      discipline: rack.discipline || null,
      winnerId: rack.winnerId || null,
    })),
    score,
    tableSize: match.tableSize || null,
    tableNumber: match.tableNumber || null,
    playedOn: match.playedOn || null,
    venue: match.venue || null,
    sourceUrl: match.sourceUrl || null,
    sent: false,
    status: missingLinks ? 'needs_review' : 'not_sent',
    exception: missingLinks ? 'A player has no Fargo id.' : null,
    supersedes: prior ? prior.idempotencyKey : null,
    reason: 'No accepted Fargo reporting path is configured.',
  };
}

export function exportFargoResult(match = {}, prior = null) {
  if (prior && Number(match.revision || 0) === Number(prior.revision)) return prior;
  const record = buildFargoExportRecord(match, prior);
  return {
    record,
    previous: prior ? { ...prior, status: 'superseded' } : null,
  };
}
