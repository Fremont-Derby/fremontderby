import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

export function fakePhoneFor(playerId) {
  const digits = String(playerId || '').replace(/\D/g, '');
  const tail = (digits + '0101010').slice(0, 7);
  return `555${tail}`;
}

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

async function writePhone(env, fetchImpl, playerId) {
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || !playerId) return false;
  const phone = fakePhoneFor(playerId);
  const response = await fetchImpl(`${base}/rest/v1/player_contacts?on_conflict=player_id`, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      'content-profile': privatePostgrestProfile('dru'),
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ player_id: playerId, phone, updated_at: new Date().toISOString() }),
  });
  return response.ok;
}

export async function ensureDruFakePhone(env, playerId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env)) return false;
  return writePhone(env, withSupabaseSchema(fetchImpl, env), playerId);
}

export async function ensureDruSeasonCaptainPhones(env, seasonId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const response = await fetchWithSchema(
    `${base}/rest/v1/team_memberships?season_id=eq.${encodeURIComponent(seasonId)}&role=eq.captain&ends_at=is.null&select=player_id`,
    { headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' } },
  );
  if (!response.ok) return 0;
  const rows = await response.json();
  let written = 0;
  for (const row of Array.isArray(rows) ? rows : []) {
    if (await writePhone(env, fetchWithSchema, row.player_id)) written += 1;
  }
  return written;
}
