import { toFargoFeed } from './fargoFeed.js';
import { planFargoReports } from './fargoReportStore.js';
import { withSupabaseSchema } from './supabaseSchema.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';

function headers(key) {
  return { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json' };
}

async function readJson(response) {
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body) ? body : [];
}

export async function loadFinalizedMatches(env, fetchImpl) {
  const base = stripTrailingSlashes(env?.SUPABASE_URL || '');
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return [];
  const matches = await readJson(await fetchImpl(
    withSupabaseSchema(fetchImpl, env)(`${base}/rest/v1/player_matches?status=in.(finalized,corrected)&select=id,status,player_a_id,player_b_id,score_a,score_b,slot_number,created_at&limit=100`),
    { headers: headers(key) },
  ));
  if (!matches.length) return [];
  const ids = matches.map((row) => row.id).join(',');
  const playerIds = [...new Set(matches.flatMap((row) => [row.player_a_id, row.player_b_id]))].join(',');
  const [racks, players, identities] = await Promise.all([
    readJson(await fetchImpl(withSupabaseSchema(fetchImpl, env)(`${base}/rest/v1/player_match_racks?player_match_id=in.(${ids})&select=player_match_id,rack_number,discipline,winner_player_id`), { headers: headers(key) })),
    readJson(await fetchImpl(withSupabaseSchema(fetchImpl, env)(`${base}/rest/v1/players?id=in.(${playerIds})&select=id,display_name`), { headers: headers(key) })),
    readJson(await fetchImpl(withSupabaseSchema(fetchImpl, env)(`${base}/rest/v1/player_external_identities?provider=eq.fargo&player_id=in.(${playerIds})&select=player_id,external_id`), { headers: headers(key) })),
  ]);
  const name = Object.fromEntries(players.map((player) => [player.id, player.display_name]));
  const fargo = Object.fromEntries(identities.map((row) => [row.player_id, row.external_id]));
  return matches.map((row) => ({
    status: row.status,
    playerMatchId: row.id,
    playerAId: row.player_a_id,
    playerBId: row.player_b_id,
    playerAName: name[row.player_a_id] || null,
    playerBName: name[row.player_b_id] || null,
    playerAFargoId: fargo[row.player_a_id] || null,
    playerBFargoId: fargo[row.player_b_id] || null,
    playedOn: row.created_at || null,
    venue: env.LEAGUE_VENUE || 'Fremont venue',
    tableSize: env.LEAGUE_TABLE_SIZE || null,
    tableNumber: row.slot_number || null,
    sourceUrl: '/api/fargo/feed',
    racks: racks.filter((rack) => rack.player_match_id === row.id).map((rack) => ({
      number: rack.rack_number,
      discipline: rack.discipline,
      winnerId: rack.winner_player_id,
    })),
  }));
}

export async function storeFargoReports(env, matches, fetchImpl) {
  const base = stripTrailingSlashes(env?.SUPABASE_URL || '');
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return;
  try {
  const stored = await readJson(await fetchImpl(withSupabaseSchema(fetchImpl, env)(`${base}/rest/v1/fargo_reports?select=player_match_id,revision,status,idempotency_key,payload`), { headers: headers(key) }));
  for (const match of matches) {
    const rows = stored.filter((row) => row.player_match_id === match.playerMatchId);
    const plan = planFargoReports(match, rows);
    if (!plan.insert) continue;
    if (plan.supersede) {
      await fetchImpl(withSupabaseSchema(fetchImpl, env)(`${base}/rest/v1/fargo_reports?idempotency_key=eq.${plan.supersede}`), {
        method: 'PATCH',
        headers: headers(key),
        body: JSON.stringify({ status: 'superseded' }),
      });
    }
    await fetchImpl(withSupabaseSchema(fetchImpl, env)(`${base}/rest/v1/fargo_reports`), {
      method: 'POST',
      headers: { ...headers(key), prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify({
        player_match_id: match.playerMatchId,
        revision: plan.record.revision,
        idempotency_key: plan.record.idempotencyKey,
        status: plan.record.status,
        payload: plan.record,
      }),
    });
  }
  } catch {}
}

export async function handleFargoFeedRequest(request, env = {}, { fetch: fetchImpl = globalThis.fetch, matches = null } = {}) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { 'cache-control': 'no-store' } });
  }
  const items = matches || await loadFinalizedMatches(env, fetchImpl);
  if (!matches) await storeFargoReports(env, items, fetchImpl);
  return Response.json(toFargoFeed(items), {
    headers: { 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
  });
}
