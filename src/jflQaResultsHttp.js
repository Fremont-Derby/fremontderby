import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { createTeamRepository } from './teamRepository.js';
import { withSupabaseSchema } from './supabaseSchema.js';
import { summarizeQaRegularMatch } from './jflQaMatchResult.js';

export const QA_SEASON = '18580000-1000-4000-8000-000000000000';
const QA_MATCH = '18580000-1300-4000-8000-000000000001';
const QA_TEAMS = new Set(['18580000-1100-4000-8000-000000000001', '18580000-1100-4000-8000-000000000002']);

async function readFixedResults(env, fetchImpl) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Result service unavailable');
  const scopedFetch = withSupabaseSchema(fetchImpl, env);
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
  const params = new URLSearchParams({
    select: 'slot_number,status,score_a,score_b,winner_side',
    season_id: `eq.${QA_SEASON}`, team_match_id: `eq.${QA_MATCH}`, order: 'slot_number.asc',
  });
  const response = await scopedFetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/player_matches?${params}`, { headers });
  if (!response.ok) throw new Error('Unable to read QA results');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Invalid result response');
  return rows.map((row) => ({ slotNumber: row.slot_number, status: row.status,
    scoreA: row.score_a, scoreB: row.score_b, winnerSide: String(row.winner_side || '').toLowerCase() }));
}

export function createJflQaResultsRoute({ authenticate = authenticateSupabaseUser,
  createTeams = createTeamRepository, readResults = readFixedResults } = {}) {
  return async function route(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
    if (new URL(request.url).pathname !== '/api/me/jfl-qa-results') return null;
    const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
    if (env?.ENVIRONMENT !== 'jfl') return json({ error: 'Not found' }, 404);
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    try {
      const actor = await authenticate(request, env, { fetch: fetchImpl });
      const management = await createTeams(env, { fetch: fetchImpl }).listOwnTeamManagement({ actorUserId: actor.id });
      const allowed = (management.captain_teams || []).some((team) =>
        (team.seasonId || team.season_id) === QA_SEASON && QA_TEAMS.has(team.teamId || team.team_id || team.id));
      if (!allowed) return json({ error: 'Only an active captain of this QA matchup can read its results.' }, 403);
      // No caller-controlled season/match identifiers reach a service-role read.
      const races = await readResults(env, fetchImpl);
      return json({ result: summarizeQaRegularMatch(races), races });
    } catch (error) {
      return json({ error: error instanceof AuthError ? error.message : 'QA results are temporarily unavailable.' },
        error instanceof AuthError ? error.status : 503);
    }
  };
}

export const routeJflQaResults = createJflQaResultsRoute();
