/**
 * #87 export only. Records a finalized match for a later Fargo report.
 * Does not call a provider. Scoring and standings do not depend on this.
 */

export function buildFargoExportRecord(match = {}) {
  if (!match.playerMatchId) throw new Error('playerMatchId is required');
  const racks = Array.isArray(match.racks) ? match.racks : [];
  return {
    playerMatchId: String(match.playerMatchId),
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
    playedOn: match.playedOn || null,
    venue: match.venue || null,
    sent: false,
    status: 'not_sent',
    reason: 'No accepted Fargo reporting path is configured.',
  };
}
