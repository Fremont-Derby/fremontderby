import { cleanHouseSettings } from './leagueHouseSettings.js';
import { renderLeagueHousePage } from './leagueHousePage.js';
import { withSupabaseSchema } from './supabaseSchema.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

function headers(key) {
  return { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json' };
}

export async function loadHouseSettings(env, fetchImpl) {
  const base = stripTrailingSlashes(env?.SUPABASE_URL || '');
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return cleanHouseSettings({});
  const request = withSupabaseSchema(fetchImpl, env);
  const response = await request(`${base}/rest/v1/league_house_settings?id=eq.1&select=venue,table_size,table_count,league_night`, { headers: headers(key) });
  if (!response.ok) return cleanHouseSettings({});
  const rows = await response.json();
  return cleanHouseSettings(Array.isArray(rows) ? rows[0] || {} : {});
}

export async function handleLeagueHouseRequest(request, env = {}, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 401;
    return new Response('Sign in to set the league house.', { status, headers: { 'content-type': 'text/plain' } });
  }
  const settings = await loadHouseSettings(env, fetchImpl);
  if (request.method === 'POST') {
    const form = await request.formData();
    const saved = cleanHouseSettings(Object.fromEntries(form.entries()));
    const base = stripTrailingSlashes(env?.SUPABASE_URL || '');
    const key = env?.SUPABASE_SERVICE_ROLE_KEY;
    if (base && key) {
      const write = withSupabaseSchema(fetchImpl, env);
      await write(`${base}/rest/v1/league_house_settings?id=eq.1`, {
        method: 'PATCH',
        headers: { ...headers(key), prefer: 'return=minimal' },
        body: JSON.stringify({
          venue: saved.venue,
          table_size: saved.tableSize,
          table_count: saved.tableCount,
          league_night: saved.leagueNight,
          updated_at: new Date().toISOString(),
        }),
      });
    }
    return new Response(renderLeagueHousePage(saved), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  return new Response(renderLeagueHousePage(settings), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
