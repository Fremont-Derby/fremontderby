import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export function lineupHasPlayers(slots) {
  return Array.isArray(slots) && slots.some((slot) => slot && (slot.playerId || slot.player_id));
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

export async function prepareDruPracticeLineup(env, { teamId, roundId, slots }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !teamId) return { prepared: false };
  if (slots && !lineupHasPlayers(slots)) {
    const error = new Error('Lineup needs three players before it can lock');
    error.status = 400;
    throw error;
  }
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { prepared: false };
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const publicHeaders = headers(key, 'public');
  const privateHeaders = headers(key, privatePostgrestProfile('dru'));
  const teamResponse = await fetchWithSchema(`${base}/rest/v1/teams?id=eq.${encodeURIComponent(teamId)}&select=season_id`, { headers: publicHeaders });
  const seasonId = (await readJson(teamResponse))[0]?.season_id;
  if (!seasonId) return { prepared: false };
  const members = await readJson(await fetchWithSchema(
    `${base}/rest/v1/team_memberships?season_id=eq.${encodeURIComponent(seasonId)}&team_id=eq.${encodeURIComponent(teamId)}&ends_at=is.null&select=player_id`,
    { headers: publicHeaders },
  ));
  if (members.length) {
    await fetchWithSchema(`${base}/rest/v1/payment_status?on_conflict=season_id,player_id`, {
      method: 'POST',
      headers: { ...privateHeaders, prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(members.map((row) => ({
        season_id: seasonId,
        player_id: row.player_id,
        status: 'waived',
        amount_due_cents: 0,
        amount_paid_cents: 0,
      }))),
    });
  }
  if (roundId) {
    const matches = await readJson(await fetchWithSchema(
      `${base}/rest/v1/team_matches?round_id=eq.${encodeURIComponent(roundId)}&or=(team_a_id.eq.${teamId},team_b_id.eq.${teamId})&select=id`,
      { headers: publicHeaders },
    ));
    for (const match of matches) {
      const lineups = await readJson(await fetchWithSchema(
        `${base}/rest/v1/team_lineups?team_match_id=eq.${match.id}&team_id=eq.${encodeURIComponent(teamId)}&select=id,slots`,
        { headers: privateHeaders },
      ));
      for (const lineup of lineups) {
        if (!lineupHasPlayers(lineup.slots)) {
          await fetchWithSchema(`${base}/rest/v1/team_lineups?id=eq.${lineup.id}`, { method: 'DELETE', headers: privateHeaders });
        }
      }
    }
  }
  return { prepared: true, waived: members.length };
}
