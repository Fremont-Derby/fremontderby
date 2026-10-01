/**
 * #72 Derive player season stats from finalized player-match rows.
 * Historical locked ratings are never rewritten here.
 */

export function summarizePlayerSeasonMatches(matches = []) {
  let played = 0;
  let wins = 0;
  let losses = 0;
  let racksWon = 0;
  let racksLost = 0;
  let eightBallRacks = 0;
  let nineBallRacks = 0;
  const timeline = [];

  for (const m of matches) {
    const status = String(m.status || m.match_status || '').toLowerCase();
    if (!['finalized', 'complete', 'completed', 'final'].includes(status) && m.winnerPlayerId == null && m.winner_player_id == null) {
      continue;
    }
    played += 1;
    const winner = m.winnerPlayerId || m.winner_player_id;
    const self = m.selfPlayerId || m.player_id || m.playerId;
    const won = winner && self && String(winner) === String(self);
    if (won) wins += 1;
    else losses += 1;

    const rw = Number(m.racksWon ?? m.racks_won ?? 0) || 0;
    const rl = Number(m.racksLost ?? m.racks_lost ?? 0) || 0;
    racksWon += rw;
    racksLost += rl;

    const disc = String(m.discipline || m.gameType || m.game_type || '').toLowerCase();
    if (disc.includes('9')) nineBallRacks += rw + rl;
    else if (disc.includes('8')) eightBallRacks += rw + rl;

    timeline.push({
      matchId: m.id || m.matchId,
      date: m.playedAt || m.played_at || m.roundDate || m.round_date,
      round: m.roundNumber || m.round_number,
      opponent: m.opponentName || m.opponent_name,
      opponentRating: m.opponentRating ?? m.opponent_rating,
      lockedRating: m.lockedRating ?? m.player_fargo_rating,
      raceTo: m.raceTo ?? m.race_to,
      teamName: m.teamName || m.team_name,
      score: m.score || `${rw}-${rl}`,
      result: won ? 'W' : 'L',
      status: status || 'finalized',
    });
  }

  const winPct = played ? Math.round((wins / played) * 1000) / 10 : 0;
  return {
    matchesPlayed: played,
    wins,
    losses,
    winPct,
    racksWon,
    racksLost,
    rackDifferential: racksWon - racksLost,
    eightBallRacks,
    nineBallRacks,
    matches: timeline,
  };
}

export function mergeDisputeTimeline(auditEvents = [], matchTimeline = []) {
  const items = [];
  for (const a of auditEvents) {
    items.push({
      kind: 'audit',
      at: a.createdAt || a.created_at || a.at,
      action: a.action,
      actor: a.actorUserId || a.actor_user_id,
      entityType: a.entityType || a.entity_type,
      entityId: a.entityId || a.entity_id,
      reason: a.reason || a.after_state?.reason || null,
    });
  }
  for (const m of matchTimeline) {
    items.push({
      kind: 'match',
      at: m.date,
      action: `match.${m.result}`,
      detail: m,
    });
  }
  items.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
  return items;
}
