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
  const existing = await fetchWithSchema(`${base}/rest/v1/teams?season_id=eq.${seasonId}&select=name`, { headers });
  if (!existing.ok) return 0;
  const have = new Set((await existing.json()).map((row) => row.name));
  const missing = names.filter((name) => !have.has(name)).slice(0, Math.max(0, 8 - have.size));
  if (!missing.length) return 0;
  const people = missing.flatMap((name) => [`${name} Captain`, `${name} One`, `${name} Two`]);
  const playerResponse = await fetchWithSchema(`${base}/rest/v1/players`, { method: 'POST', headers, body: JSON.stringify(people.map((display_name) => ({ display_name }))) });
  if (!playerResponse.ok) return 0;
  const players = await playerResponse.json();
  const teamResponse = await fetchWithSchema(`${base}/rest/v1/teams`, { method: 'POST', headers, body: JSON.stringify(missing.map((name) => ({ season_id: seasonId, name, created_by: actorUserId }))) });
  if (!teamResponse.ok) return 0;
  const teams = await teamResponse.json();
  const memberships = [];
  const slots = [];
  teams.forEach((team, index) => {
    const captain = players[index * 3];
    const one = players[index * 3 + 1];
    const two = players[index * 3 + 2];
    if (captain) memberships.push({ season_id: seasonId, team_id: team.id, player_id: captain.id, role: 'captain' });
    if (one) memberships.push({ season_id: seasonId, team_id: team.id, player_id: one.id, role: 'player' });
    if (two) memberships.push({ season_id: seasonId, team_id: team.id, player_id: two.id, role: 'player' });
    if (captain) slots.push({ season_id: seasonId, team_id: team.id, assigned_captain_player_id: captain.id, status: 'confirmed', last_action_reason: 'DRU practice team' });
  });
  if (memberships.length) await fetchWithSchema(`${base}/rest/v1/team_memberships`, { method: 'POST', headers, body: JSON.stringify(memberships) });
  if (slots.length) await fetchWithSchema(`${base}/rest/v1/season_team_slots`, { method: 'POST', headers: privateHeaders, body: JSON.stringify(slots) });
  return teams.length;
}
