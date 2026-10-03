import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export async function registerDruSlotRoster(env, slotId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !slotId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    accept: 'application/json',
    'content-type': 'application/json',
    'accept-profile': privatePostgrestProfile('dru'),
  };
  const slotResponse = await fetchWithSchema(
    `${base}/rest/v1/season_team_slots?id=eq.${encodeURIComponent(slotId)}&select=team_id,season_id`,
    { headers },
  );
  if (!slotResponse.ok) return 0;
  const slot = (await slotResponse.json())?.[0];
  if (!slot?.team_id || !slot?.season_id) return 0;
  const members = await fetchWithSchema(
    `${base}/rest/v1/team_memberships?team_id=eq.${encodeURIComponent(slot.team_id)}&season_id=eq.${encodeURIComponent(slot.season_id)}&ends_at=is.null&select=player_id`,
    { headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' } },
  );
  if (!members.ok) return 0;
  let rows = await members.json();
  if ((Array.isArray(rows) ? rows.length : 0) < 4) {
    const { prepareDruPracticePublish } = await import('./druPublishPrep.js');
    await prepareDruPracticePublish(env, slot.season_id, fetchImpl);
    const again = await fetchWithSchema(
      `${base}/rest/v1/team_memberships?team_id=eq.${encodeURIComponent(slot.team_id)}&season_id=eq.${encodeURIComponent(slot.season_id)}&ends_at=is.null&select=player_id`,
      { headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' } },
    );
    if (again.ok) rows = await again.json();
  }
  let written = 0;
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row?.player_id) continue;
    const inserted = await fetchWithSchema(`${base}/rest/v1/season_players?on_conflict=season_id,player_id`, {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        season_id: slot.season_id,
        player_id: row.player_id,
        participation_type: 'rostered',
        status: 'active',
      }),
    });
    if (inserted.ok) written += 1;
  }
  return written;
}
