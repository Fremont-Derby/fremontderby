/**
 * Choose which league night to show first.
 * Single linear pass — O(r + m) — instead of repeated filter/sort chains.
 */
export function preferredRoundId(rounds, {
  requestedRound = '',
  today = new Date().toISOString().slice(0, 10),
  seasonComplete = false,
  now = Date.now(),
} = {}) {
  if (!Array.isArray(rounds) || rounds.length === 0) return '';
  if (requestedRound && rounds.some((round) => round.roundId === requestedRound)) {
    return requestedRound;
  }

  let bestLive = null;
  let bestLiveScore = -Infinity;
  let bestUpcoming = null;
  let bestUpcomingDistance = Infinity;
  let bestFinal = null;
  let bestFinalStage = -1;

  for (const round of rounds) {
    const matches = round.matches || [];
    let hasLive = false;
    let hasFinal = false;
    for (const match of matches) {
      const status = match.status;
      if (status === 'in_progress') hasLive = true;
      if (status === 'finalized' || status === 'corrected') hasFinal = true;
    }
    if (round.status === 'finalized') hasFinal = true;

    const stage = round.stage === 'championship' ? 4
      : round.stage === 'semifinal' ? 3
        : round.stage === 'tiebreaker' ? 2
          : 1;
    const distance = Number.isFinite(Date.parse(round.scheduledOn || ''))
      ? Math.abs(Date.parse(round.scheduledOn) - now)
      : Number.MAX_SAFE_INTEGER;

    if (hasLive && !seasonComplete) {
      const score = stage * 1e15 - distance;
      if (score > bestLiveScore) {
        bestLiveScore = score;
        bestLive = round.roundId;
      }
    }
    if (seasonComplete && hasFinal && stage >= bestFinalStage) {
      bestFinalStage = stage;
      bestFinal = round.roundId;
    }
    if (!round.scheduledOn || round.scheduledOn >= today) {
      if (distance < bestUpcomingDistance) {
        bestUpcomingDistance = distance;
        bestUpcoming = round.roundId;
      }
    }
  }

  if (bestLive) return bestLive;
  if (seasonComplete && bestFinal) return bestFinal;
  return bestUpcoming || rounds[rounds.length - 1].roundId || '';
}
