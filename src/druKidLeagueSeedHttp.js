import { authenticateSupabaseUser, AuthError } from './supabaseAuth.js';
import { createAdminPlayersRepository } from './adminPlayersRepository.js';
import { createAdminSeasonTeamsRepository } from './adminSeasonTeamsRepository.js';
import { createSupabaseSeasonRepository } from './supabaseSeasonRepository.js';
import { saveSeasonSetupCommand } from './seasonSetupCommands.js';
import { seedDruKidLeague } from './druKidLeagueSeed.js';
import { KID_LEAGUE_SEASON_NAME, KID_LEAGUE_TEAMS } from './druKidLeagueCatalog.js';

function isDru(env = {}) {
  return String(env.ENVIRONMENT || '').trim() === 'dru';
}

function statusFor(error) {
  if (error instanceof AuthError) return error.status;
  if (/required|must be/i.test(error.message)) return 400;
  if (/not a league admin/i.test(error.message)) return 403;
  return 502;
}

export async function routeDruKidLeagueSeed(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/';
  if (path !== '/api/dru/kid-league-seed') return null;
  if (!isDru(env)) {
    return Response.json({ error: 'Not found' }, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  if (request.method === 'GET') {
    return Response.json(
      { seasonName: KID_LEAGUE_SEASON_NAME, teams: KID_LEAGUE_TEAMS.map((team) => team.teamName) },
      { headers: { 'cache-control': 'no-store' } },
    );
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { 'cache-control': 'no-store' } });
  }

  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const seasons = createSupabaseSeasonRepository(env, { fetch: fetchImpl });
    const seasonTeams = createAdminSeasonTeamsRepository(env, { fetch: fetchImpl });
    const players = createAdminPlayersRepository(env, { fetch: fetchImpl });
    const result = await seedDruKidLeague({
      actorUserId: actor.id,
      listSeasons: () => seasons.listAdminSeasons({ actorUserId: actor.id }),
      saveSeasonSetup: (input) => saveSeasonSetupCommand(input, seasons),
      listSeasonTeams: async ({ actorUserId, seasonId }) => {
        const state = await seasonTeams.list({ actorUserId, seasonId });
        return state?.teams || [];
      },
      createPreparedTeam: (input) => seasonTeams.createPrepared(input),
      addTeamToSeason: (input) => seasonTeams.add(input),
      createPlayer: (input) => players.createPlayer(input),
      setRosterMembership: (input) => players.setRosterMembership(input),
      assignCaptain: (input) => seasonTeams.assignCaptain(input),
    });
    return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: statusFor(error), headers: { 'cache-control': 'no-store' } },
    );
  }
}
