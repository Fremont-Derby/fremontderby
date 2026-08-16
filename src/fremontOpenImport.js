/**
 * #85 Fremont Open import helpers — external evidence only.
 * Does not touch Derby standings.
 */

export function parseOpenScoreString(raw) {
  const cleaned = String(raw || '').trim();
  if (!cleaned) return { winnerRacks: null, loserRacks: null, confidence: 'match_wl_only' };
  const m = cleaned.match(/^(\d+)\s*[-:]\s*(\d+)$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return {
      winnerRacks: Math.max(a, b),
      loserRacks: Math.min(a, b),
      confidence: 'high',
    };
  }
  return { winnerRacks: null, loserRacks: null, confidence: 'match_wl_only' };
}

/** Normalize a match payload for upsert; stable external ids required. */
export function normalizeFremontOpenMatch(input = {}) {
  const externalEventId = String(input.externalEventId || input.eventId || '').trim();
  const externalMatchId = String(input.externalMatchId || input.matchId || '').trim();
  if (!externalEventId || !externalMatchId) {
    throw new Error('externalEventId and externalMatchId are required');
  }
  const rawScore = input.rawScore ?? input.score ?? null;
  const parsed = parseOpenScoreString(rawScore);
  return {
    externalEventId,
    eventName: String(input.eventName || input.tournamentName || externalEventId).trim(),
    externalMatchId,
    playedOn: input.playedOn || input.date || null,
    gameType: input.gameType || input.discipline || null,
    roundLabel: input.roundLabel || input.round || null,
    rawScore,
    winnerExternalId: input.winnerExternalId || input.winnerId || null,
    loserExternalId: input.loserExternalId || input.loserId || null,
    winnerName: input.winnerName || null,
    loserName: input.loserName || null,
    racksWonWinner: input.racksWonWinner ?? parsed.winnerRacks,
    racksWonLoser: input.racksWonLoser ?? parsed.loserRacks,
    scoreParseConfidence: input.scoreParseConfidence || parsed.confidence,
    provenance: {
      ...(input.provenance || {}),
      importer: 'fremontOpenImport',
    },
  };
}

export function dedupeMatchKeys(matches) {
  const seen = new Set();
  const out = [];
  for (const m of matches) {
    const key = `${m.externalEventId}::${m.externalMatchId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}
