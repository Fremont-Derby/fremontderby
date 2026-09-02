import { listIndividualStandingsCommand, listTeamStandingsCommand } from './standingsCommands.js';
import { createStandingsRepository } from './standingsRepository.js';
import { getSeasonPrizeSummaryCommand } from './prizeCommands.js';
import { createPrizeRepository } from './prizeRepository.js';
import { listSeasonFreeAgentsCommand } from './freeAgentCommands.js';
import { createFreeAgentRepository } from './freeAgentRepository.js';

const POSTGRES_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEAM_STANDINGS_RE = /^\/api\/seasons\/([^/]+)\/(?:team-standings|standings)$/;
const INDIVIDUAL_STANDINGS_RE = /^\/api\/seasons\/([^/]+)\/(?:individual-standings|player-standings)$/;
const PRIZES_RE = /^\/api\/seasons\/([^/]+)\/(?:prizes|awards|prize-summary)$/;
const FREE_AGENTS_RE = /^\/api\/seasons\/([^/]+)\/(?:free-agents|fa|free_agents|eligible-free-agents)$/;

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function invalidSeasonLink() {
  return jsonResponse({ error: 'That season or match link is invalid.' }, 400);
}

function canQuerySupabase(env) {
  return Boolean(env?.SUPABASE_URL && env?.SUPABASE_SERVICE_ROLE_KEY);
}

function emptyPrizeSummary(seasonId) {
  return {
    season_id: seasonId || null,
    season_name: null,
    season_status: null,
    player_count: 0,
    paid_amount_cents: 0,
    committed_amount_cents: 0,
    entry_fee_cents: 0,
    administration_amount_cents: 0,
    projected_field_size: 0,
    projected_gross_cents: 0,
    projected_prize_pool_cents: 0,
    team_allocation_basis_points: 0,
    individual_allocation_basis_points: 0,
    team_prize_pool_cents: 0,
    individual_prize_pool_cents: 0,
    configuration_version: null,
    configured_at: null,
    projected_payouts: [],
    finalized_payouts: [],
  };
}

export async function routeJflSeasonPublicReads(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (env?.ENVIRONMENT !== 'jfl' || !request) return null;

  const url = new URL(request.url);
  const teamMatch = url.pathname.match(TEAM_STANDINGS_RE);
  const individualMatch = url.pathname.match(INDIVIDUAL_STANDINGS_RE);
  const prizesMatch = url.pathname.match(PRIZES_RE);
  const freeAgentsMatch = url.pathname.match(FREE_AGENTS_RE);
  if (!teamMatch && !individualMatch && !prizesMatch && !freeAgentsMatch) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const seasonId = decodeURIComponent(
    (teamMatch || individualMatch || prizesMatch || freeAgentsMatch)[1],
  );
  if (!POSTGRES_UUID_RE.test(seasonId)) return invalidSeasonLink();

  try {
    if (freeAgentsMatch) {
      if (!canQuerySupabase(env)) return jsonResponse({ freeAgents: [] });
      const repository = createFreeAgentRepository(env, { fetch: fetchImpl });
      const freeAgents = await listSeasonFreeAgentsCommand({ seasonId }, repository);
      return jsonResponse({ freeAgents: Array.isArray(freeAgents) ? freeAgents : [] });
    }
    if (prizesMatch) {
      if (!canQuerySupabase(env)) return jsonResponse({ summary: emptyPrizeSummary(seasonId) });
      const repository = createPrizeRepository(env, { fetch: fetchImpl });
      const summary = await getSeasonPrizeSummaryCommand({ seasonId }, repository);
      return jsonResponse({ summary: summary || emptyPrizeSummary(seasonId) });
    }

    if (!canQuerySupabase(env)) return jsonResponse({ standings: [] });
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const seasons = await repository.listPublicSeasons();
    if (!seasons.some((season) => season.id === seasonId)) {
      return jsonResponse({ error: 'Season not found' }, 404);
    }
    if (teamMatch) {
      const standings = await listTeamStandingsCommand({ seasonId }, repository);
      return jsonResponse({ standings: Array.isArray(standings) ? standings : [] });
    }
    const standings = await listIndividualStandingsCommand({ seasonId }, repository);
    return jsonResponse({ standings: Array.isArray(standings) ? standings : [] });
  } catch (error) {
    if (prizesMatch) return jsonResponse({ summary: emptyPrizeSummary(seasonId) });
    if (freeAgentsMatch) return jsonResponse({ freeAgents: [] });
    if (teamMatch || individualMatch) return jsonResponse({ standings: [] });
    return jsonResponse({ error: error?.message || 'Unable to load season data.' }, 500);
  }
}
