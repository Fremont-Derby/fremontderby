/**
 * #86 Derby provisional estimate — Fargo-like scale, never labeled Official Fargo.
 * Lightweight anchored average with prior regularization for sparse evidence.
 */

export const DERBY_ESTIMATE_VERSION = 'derby-estimate-v1';
export const DEFAULT_PRIOR = 500;
export const DEFAULT_PRIOR_STRENGTH = 4; // virtual games toward prior

/**
 * @typedef {{ opponentRating: number, won: boolean, weight?: number }} EvidenceEdge
 */

/**
 * Convert W/L vs known-strength opponents into an estimate.
 * Prefer rack-level weight > match-only.
 */
export function computeDerbyEstimate(edges, {
  prior = DEFAULT_PRIOR,
  priorStrength = DEFAULT_PRIOR_STRENGTH,
} = {}) {
  const list = Array.isArray(edges) ? edges.filter((e) => e && Number.isFinite(Number(e.opponentRating))) : [];
  if (!list.length) {
    return {
      rating: prior,
      confidence: 'low',
      evidenceCount: 0,
      effectiveWeight: 0,
      version: DERBY_ESTIMATE_VERSION,
      method: 'prior_only',
    };
  }

  let winMass = 0;
  let lossMass = 0;
  let ratingMass = 0;
  let weightSum = 0;

  for (const e of list) {
    const w = Number(e.weight) > 0 ? Number(e.weight) : 1;
    const opp = Number(e.opponentRating);
    weightSum += w;
    ratingMass += opp * w;
    if (e.won) winMass += w;
    else lossMass += w;
  }

  const meanOpp = ratingMass / weightSum;
  // Shift estimate above/below mean opponent by win rate vs 0.5
  const winRate = winMass / Math.max(weightSum, 1e-9);
  const shift = (winRate - 0.5) * 80; // ~40 pts for 100% vs 0% in a balanced sample
  const raw = meanOpp + shift;

  // Shrink toward prior by priorStrength virtual games
  const total = weightSum + priorStrength;
  const rating = Math.round(
    Math.min(1000, Math.max(0, (raw * weightSum + prior * priorStrength) / total)),
  );

  let confidence = 'low';
  if (weightSum >= 12) confidence = 'high';
  else if (weightSum >= 5) confidence = 'medium';

  return {
    rating,
    confidence,
    evidenceCount: list.length,
    effectiveWeight: Math.round(weightSum * 100) / 100,
    winRate: Math.round(winRate * 1000) / 1000,
    meanOpponent: Math.round(meanOpp),
    version: DERBY_ESTIMATE_VERSION,
    method: 'anchored_wl_v1',
  };
}

/** Build edges from Open match rows when opponent has a known seed. */
export function edgesFromOpenMatches(matches, {
  playerExternalIds = new Set(),
  ratingByExternalId = new Map(),
  ratingByName = new Map(),
} = {}) {
  const edges = [];
  for (const m of matches || []) {
    const winnerId = m.winner_external_id || m.winnerExternalId;
    const loserId = m.loser_external_id || m.loserExternalId;
    const winnerName = (m.winner_name || m.winnerName || '').toLowerCase();
    const loserName = (m.loser_name || m.loserName || '').toLowerCase();

    const playerIsWinner =
      (winnerId && playerExternalIds.has(String(winnerId))) ||
      (winnerName && [...playerExternalIds].length === 0 && false);

    // Resolve via external ids preferentially
    let selfIsWinner = winnerId && playerExternalIds.has(String(winnerId));
    let selfIsLoser = loserId && playerExternalIds.has(String(loserId));
    if (!selfIsWinner && !selfIsLoser) continue;

    const oppId = selfIsWinner ? loserId : winnerId;
    const oppName = (selfIsWinner ? loserName : winnerName);
    let oppRating = oppId != null ? ratingByExternalId.get(String(oppId)) : null;
    if (oppRating == null && oppName) oppRating = ratingByName.get(oppName);

    if (oppRating == null || !Number.isFinite(Number(oppRating))) continue;

    const racksW = m.racks_won_winner ?? m.racksWonWinner;
    const racksL = m.racks_won_loser ?? m.racksWonLoser;
    let weight = 1;
    if (Number.isFinite(Number(racksW)) && Number.isFinite(Number(racksL))) {
      weight = Math.min(8, Math.max(1, (Number(racksW) + Number(racksL)) / 3));
    } else {
      weight = 0.6; // match W/L only
    }

    edges.push({ opponentRating: Number(oppRating), won: Boolean(selfIsWinner), weight });
  }
  return edges;
}
