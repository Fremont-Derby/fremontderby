import { toFargoFeed } from './fargoFeed.js';
import { withSupabaseSchema } from './supabaseSchema.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';

async function loadFinalizedMatches(env, fetchImpl) {
  const base = stripTrailingSlashes(env?.SUPABASE_URL || '');
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return [];
  const response = await fetchImpl(
    withSupabaseSchema(`${base}/rest/v1/player_matches?status=in.(finalized,corrected)&select=id,status,player_a_id,player_b_id,winner_side&limit=100`),
    { headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' } },
  );
  if (!response.ok) return [];
  const rows = await response.json();
  return Array.isArray(rows) ? rows.map((row) => ({
    status: row.status,
    playerMatchId: row.id,
    playerAId: row.player_a_id,
    playerBId: row.player_b_id,
    racks: [],
    sourceUrl: '/api/fargo/feed',
  })) : [];
}

export async function handleFargoFeedRequest(request, env = {}, { fetch: fetchImpl = globalThis.fetch, matches = null } = {}) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { 'cache-control': 'no-store' } });
  }
  const items = matches || await loadFinalizedMatches(env, fetchImpl);
  return Response.json(toFargoFeed(items), {
    headers: { 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
  });
}
