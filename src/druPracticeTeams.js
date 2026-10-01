import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

const names = ['Button Tail Flyers', 'Cloud Ribbon Club', 'Paper Sparrow', 'Red Wagon Rollers', 'Pocket Compass', 'Lemon Kite Kids', 'Marshmallow Wind'];

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export async function ensureDruPracticeTeams(env, { seasonId, actorUserId }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId || !actorUserId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=representation' };
  const privateHeaders = { ...headers, 'content-profile': privatePostgrestProfile('dru'), 'accept-profile': privatePostgrestProfile('dru') };
  const existing = await fetchWithSchema(`${base}/rest/v1/teams?season_id=eq.${seasonId}&select=id,name`, { headers });
  if (!existing.ok) return 0;
  const have = new Set((await existing.json()).map((row) => row.name));
  let created = 0;
  for (const name of names) {
    if (have.has(name) || have.size + created >= 8) continue;
    const captain = await fetchWithSchema(`${base}/rest/v1/players`, { method: 'POST', headers, body: JSON.stringify({ display_name: `${name} Captain` }) });
    if (!captain.ok) continue;
    const captainId = (await captain.json())?.[0]?.id;
    const team = await fetchWithSchema(`${base}/rest/v1/teams`, { method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, name, created_by: actorUserId }) });
    if (!team.ok || !captainId) continue;
    const teamId = (await team.json())?.[0]?.id;
    await fetchWithSchema(`${base}/rest/v1/team_memberships`, { method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, team_id: teamId, player_id: captainId, role: 'captain' }) });
    for (const label of ['One', 'Two']) {
      const player = await fetchWithSchema(`${base}/rest/v1/players`, { method: 'POST', headers, body: JSON.stringify({ display_name: `${name} ${label}` }) });
      if (!player.ok) continue;
      const playerId = (await player.json())?.[0]?.id;
      await fetchWithSchema(`${base}/rest/v1/team_memberships`, { method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, team_id: teamId, player_id: playerId, role: 'player' }) });
    }
    await fetchWithSchema(`${base}/rest/v1/season_team_slots`, { method: 'POST', headers: privateHeaders, body: JSON.stringify({ season_id: seasonId, team_id: teamId, assigned_captain_player_id: captainId, status: 'confirmed', last_action_reason: 'DRU practice team' }) });
    created += 1;
  }
  return created;
}
