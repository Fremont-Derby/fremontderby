/**
 * Path B / #87 foundation — Challonge Candidate A publish client.
 * Publishes only real finalized Derby results. No-op without CHALLONGE_API_KEY.
 * Never required for standings or scoring.
 */

export const CHALLONGE_API_BASE = 'https://api.challonge.com/v1';

export function challongeConfigured(env = {}) {
  return Boolean(String(env.CHALLONGE_API_KEY || env.CHALLONGE_API_TOKEN || '').trim());
}

function apiKey(env) {
  return String(env.CHALLONGE_API_KEY || env.CHALLONGE_API_TOKEN || '').trim();
}

/**
 * Build a 2-player SE tournament payload from a finalized Derby player match.
 */
export function buildCandidateATournament({
  playerMatchId,
  playerAName,
  playerBName,
  playerAFargoId = null,
  playerBFargoId = null,
  racksA,
  racksB,
  discipline = '8-ball',
  playedOn = null,
} = {}) {
  if (!playerMatchId) throw new Error('playerMatchId is required');
  const a = String(playerAName || 'Player A').trim() || 'Player A';
  const b = String(playerBName || 'Player B').trim() || 'Player B';
  const urlSlug = `fd-${String(playerMatchId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)}`.toLowerCase();
  const description = [
    'Fremont Derby finalized player match (Candidate A publish).',
    `derby_player_match_id=${playerMatchId}`,
    discipline ? `discipline=${discipline}` : null,
    playedOn ? `played_on=${playedOn}` : null,
    playerAFargoId ? `player_a_fargo=${playerAFargoId}` : null,
    playerBFargoId ? `player_b_fargo=${playerBFargoId}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    urlSlug,
    tournament: {
      name: `Derby ${a} vs ${b}`.slice(0, 60),
      url: urlSlug,
      tournament_type: 'single elimination',
      description,
      open_signup: false,
      private: false,
      game_name: discipline || 'billiards',
    },
    participants: [
      { name: a, misc: playerAFargoId || undefined },
      { name: b, misc: playerBFargoId || undefined },
    ],
    score: {
      racksA: Number(racksA) || 0,
      racksB: Number(racksB) || 0,
    },
  };
}

async function challongeRequest(env, path, { method = 'GET', body = null, fetchImpl = globalThis.fetch } = {}) {
  const key = apiKey(env);
  if (!key) {
    const err = new Error('CHALLONGE_API_KEY is not configured');
    err.code = 'CHALLONGE_NOT_CONFIGURED';
    throw err;
  }
  const url = new URL(`${CHALLONGE_API_BASE}${path}`);
  url.searchParams.set('api_key', key);
  const res = await fetchImpl(url.toString(), {
    method,
    headers: body ? { 'content-type': 'application/json', accept: 'application/json' } : { accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Challonge ${method} ${path} failed: ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * Dry-run or live publish. When dryRun/missing key, returns plan only.
 */
export async function publishPlayerMatchCandidateA(env, match, { dryRun = false, fetchImpl = globalThis.fetch } = {}) {
  const plan = buildCandidateATournament(match);
  if (dryRun || !challongeConfigured(env)) {
    return {
      status: dryRun ? 'dry_run' : 'not_configured',
      plan,
      publicUrl: null,
      tournamentId: null,
    };
  }

  // 1) Create tournament
  const created = await challongeRequest(env, '/tournaments.json', {
    method: 'POST',
    body: { tournament: plan.tournament },
    fetchImpl,
  });
  const tournament = created?.tournament || created;
  const tournamentId = tournament?.id || plan.urlSlug;

  // 2) Add participants
  const participantIds = [];
  for (const p of plan.participants) {
    const row = await challongeRequest(env, `/tournaments/${tournamentId}/participants.json`, {
      method: 'POST',
      body: { participant: { name: p.name, misc: p.misc } },
      fetchImpl,
    });
    participantIds.push(row?.participant?.id || null);
  }

  // 3) Start tournament so matches exist
  await challongeRequest(env, `/tournaments/${tournamentId}/start.json`, {
    method: 'POST',
    fetchImpl,
  });

  // 4) Load matches and report score on the first open match
  const matchesPayload = await challongeRequest(env, `/tournaments/${tournamentId}/matches.json`, {
    fetchImpl,
  });
  const matches = Array.isArray(matchesPayload) ? matchesPayload.map((m) => m.match || m) : [];
  const open = matches.find((m) => m.state !== 'complete') || matches[0];
  if (open?.id) {
    const scoreCsv = `${plan.score.racksA}-${plan.score.racksB}`;
    // winner_id: higher racks
    const winnerId =
      plan.score.racksA >= plan.score.racksB ? participantIds[0] : participantIds[1];
    await challongeRequest(env, `/tournaments/${tournamentId}/matches/${open.id}.json`, {
      method: 'PUT',
      body: {
        match: {
          scores_csv: scoreCsv,
          winner_id: winnerId,
        },
      },
      fetchImpl,
    });
  }

  // 5) Finalize
  await challongeRequest(env, `/tournaments/${tournamentId}/finalize.json`, {
    method: 'POST',
    fetchImpl,
  }).catch(() => null);

  const publicUrl = tournament?.full_challonge_url || `https://challonge.com/${plan.urlSlug}`;
  return {
    status: 'published',
    plan,
    publicUrl,
    tournamentId,
    participantIds,
    provenance: {
      provider: 'challonge',
      candidate: 'A',
      derbyPlayerMatchId: match.playerMatchId,
      publishedAt: new Date().toISOString(),
    },
  };
}
