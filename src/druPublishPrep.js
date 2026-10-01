import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export function practiceDepthFloor(seasonMinimum) {
  return Math.max(4, Number(seasonMinimum || 3));
}

export function practiceRosterPlan(teams = [], memberships = [], players = [], minimum = 3) {
  const used = new Set(memberships.map((row) => row.player_id));
  const spare = players.filter((player) => player.id && !used.has(player.id));
  const adds = [];
  const seasonPlayers = [];
  for (const team of teams) {
    const members = memberships.filter((row) => row.team_id === team.id);
    const needed = Math.max(0, minimum - members.length);
    const picked = spare.splice(0, needed);
    for (const player of picked) {
      adds.push({ team_id: team.id, player_id: player.id, role: 'player' });
      used.add(player.id);
    }
    for (const member of [...members, ...picked.map((player) => ({ player_id: player.id }))]) {
      seasonPlayers.push({ player_id: member.player_id, team_id: team.id });
    }
  }
  return { adds, seasonPlayers };
}

export async function prepareDruPracticePublish(env, seasonId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId) return { prepared: false };
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { prepared: false };
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json' };
  const seasonResponse = await fetchWithSchema(`${base}/rest/v1/seasons?id=eq.${seasonId}&select=id,name,minimum_committed_roster`, { headers });
  if (!seasonResponse.ok) return { prepared: false };
  const season = (await seasonResponse.json())?.[0];
  if (!season || season.name === 'Season 1') return { prepared: false };
  const minimum = practiceDepthFloor(season.minimum_committed_roster);
  const [teamsResponse, membershipResponse, playerResponse] = await Promise.all([
    fetchWithSchema(`${base}/rest/v1/teams?season_id=eq.${seasonId}&select=id,name`, { headers }),
    fetchWithSchema(`${base}/rest/v1/team_memberships?season_id=eq.${seasonId}&ends_at=is.null&select=team_id,player_id,role`, { headers }),
    fetchWithSchema(`${base}/rest/v1/players?select=id&limit=80`, { headers }),
  ]);
  if (!teamsResponse.ok || !membershipResponse.ok || !playerResponse.ok) return { prepared: false };
  const teams = await teamsResponse.json();
  const memberships = await membershipResponse.json();
  const players = await playerResponse.json();
  const plan = practiceRosterPlan(teams, memberships, players, minimum);
  for (const add of plan.adds) {
    await fetchWithSchema(`${base}/rest/v1/team_memberships`, {
      method: 'POST',
      headers: { ...headers, prefer: 'return=minimal' },
      body: JSON.stringify({ season_id: seasonId, team_id: add.team_id, player_id: add.player_id, role: 'player' }),
    });
  }
  if (plan.seasonPlayers.length) {
    await fetchWithSchema(`${base}/rest/v1/season_players?on_conflict=season_id,player_id`, {
      method: 'POST',
      headers: { ...headers, prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(plan.seasonPlayers.map((row) => ({
        season_id: seasonId,
        player_id: row.player_id,
        participation_type: 'rostered',
        status: 'active',
      }))),
    });
  }
  const privateHeaders = { ...headers, 'content-profile': privatePostgrestProfile('dru'), 'accept-profile': privatePostgrestProfile('dru'), prefer: 'return=minimal' };
  for (const team of teams) {
    const captain = memberships.find((row) => row.team_id === team.id && row.role === 'captain');
    await fetchWithSchema(`${base}/rest/v1/season_team_slots`, {
      method: 'POST',
      headers: privateHeaders,
      body: JSON.stringify({
        season_id: seasonId,
        team_id: team.id,
        assigned_captain_player_id: captain?.player_id || null,
        status: 'confirmed',
        last_action_reason: 'DRU practice night',
        resolved_at: new Date().toISOString(),
      }),
    });
  }
  return { prepared: true, teams: teams.length, added: plan.adds.length };
}
