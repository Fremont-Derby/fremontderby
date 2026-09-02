import { listIndividualStandingsCommand, listTeamStandingsCommand } from './standingsCommands.js';
import { createStandingsRepository } from './standingsRepository.js';
import { getSeasonPrizeSummaryCommand } from './prizeCommands.js';
import { createPrizeRepository } from './prizeRepository.js';

const POSTGRES_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEAM_STANDINGS_RE = /^\/api\/seasons\/([^/]+)\/team-standings$/;
const INDIVIDUAL_STANDINGS_RE = /^\/api\/seasons\/([^/]+)\/individual-standings$/;
const PRIZES_RE = /^\/api\/seasons\/([^/]+)\/prizes$/;

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function invalidSeasonLink() {
  return jsonResponse({ error: 'That season or match link is invalid.' }, 400);
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
  if (!teamMatch && !individualMatch && !prizesMatch) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const seasonId = decodeURIComponent((teamMatch || individualMatch || prizesMatch)[1]);
  if (!POSTGRES_UUID_RE.test(seasonId)) return invalidSeasonLink();

  try {
    if (prizesMatch) {
      const repository = createPrizeRepository(env, { fetch: fetchImpl });
      const summary = await getSeasonPrizeSummaryCommand({ seasonId }, repository);
      return jsonResponse({ summary });
    }

    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const seasons = await repository.listPublicSeasons();
    if (!seasons.some((season) => season.id === seasonId)) {
      return jsonResponse({ error: 'Season not found' }, 404);
    }
    if (teamMatch) {
      const standings = await listTeamStandingsCommand({ seasonId }, repository);
      return jsonResponse({ standings });
    }
    const standings = await listIndividualStandingsCommand({ seasonId }, repository);
    return jsonResponse({ standings });
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Unable to load season data.' }, 500);
  }
}
