import { summarizePlayerSeasonMatches } from './playerSeasonStats.js';
import { withSupabaseSchema } from './supabaseSchema.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

export async function handlePlayerStatsSummaryRequest(request, env = {}, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 401;
    return Response.json({ error: 'Sign in to load a player summary.' }, { status });
  }
  const playerId = new URL(request.url).searchParams.get('playerId') || '';
  if (!playerId) return Response.json({ error: 'Choose a player.' }, { status: 400 });
  const base = stripTrailingSlashes(env?.SUPABASE_URL || '');
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return Response.json({ error: 'Player summary is unavailable.' }, { status: 503 });
  const read = withSupabaseSchema(fetchImpl, env);
  const response = await read(`${base}/rest/v1/player_matches?or=(player_a_id.eq.${playerId},player_b_id.eq.${playerId})&status=in.(finalized,corrected)&select=id,status,player_a_id,player_b_id,score_a,score_b,created_at&limit=100`, {
    headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' },
  });
  if (!response.ok) return Response.json({ error: 'Player summary could not be loaded.' }, { status: 503 });
  const rows = await response.json();
  const matches = (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    selfPlayerId: playerId,
    winner_player_id: Number(row.score_a) === Number(row.score_b) ? null : (Number(row.score_a) > Number(row.score_b) ? row.player_a_id : row.player_b_id),
    racks_won: String(row.player_a_id) === playerId ? row.score_a : row.score_b,
    racks_lost: String(row.player_a_id) === playerId ? row.score_b : row.score_a,
  }));
  return Response.json(summarizePlayerSeasonMatches(matches));
}
