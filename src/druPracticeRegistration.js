import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

function headers(key, profile) {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    accept: 'application/json',
    'content-type': 'application/json',
    'accept-profile': profile,
    'content-profile': profile,
  };
}

async function readJson(response) {
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body) ? body : [];
}

export async function ensureDruPracticeRegistrations(env, seasonId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const memberships = await fetchWithSchema(
    `${base}/rest/v1/team_memberships?season_id=eq.${encodeURIComponent(seasonId)}&ends_at=is.null&select=player_id`,
    { headers: headers(key, 'public') },
  );
  const rows = [...new Set((await readJson(memberships)).map((row) => row.player_id).filter(Boolean))]
    .map((playerId) => ({
      season_id: seasonId,
      player_id: playerId,
      participation_type: 'rostered',
      status: 'active',
    }));
  if (!rows.length) return 0;
  const saved = await fetchWithSchema(`${base}/rest/v1/season_players?on_conflict=season_id,player_id`, {
    method: 'POST',
    headers: {
      ...headers(key, 'public'),
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  return saved.ok ? rows.length : 0;
}

export async function ensureDruSlotPracticeRegistrations(env, slotId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !slotId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const slot = await fetchWithSchema(
    `${base}/rest/v1/season_team_slots?id=eq.${encodeURIComponent(slotId)}&select=season_id`,
    { headers: headers(key, privatePostgrestProfile('dru')) },
  );
  const seasonId = (await readJson(slot))[0]?.season_id;
  return ensureDruPracticeRegistrations(env, seasonId, fetchImpl);
}
