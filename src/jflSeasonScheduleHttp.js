import { createStandingsRepository } from './standingsRepository.js';
import { enrichFinishedScheduleRounds } from './jflFinishedMatchResults.js';

const POSTGRES_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SCHEDULE_PATH_RE = /^\/api\/seasons\/([^/]+)\/schedule$/;

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

export async function routeJflSeasonSchedule(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (env?.ENVIRONMENT !== 'jfl') return null;

  const url = new URL(request.url);
  const match = url.pathname.match(SCHEDULE_PATH_RE);
  if (!match) return null;
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  const seasonId = decodeURIComponent(match[1]);
  if (!POSTGRES_UUID_RE.test(seasonId)) {
    return jsonResponse({ error: 'That season or match link is invalid.' }, 400);
  }

  try {
    const repository = createStandingsRepository(env, { fetch: fetchImpl });
    const seasons = await repository.listPublicSeasons();
    if (!seasons.some((season) => season.id === seasonId)) {
      return jsonResponse({ error: 'Season not found' }, 404);
    }
    const scheduleRounds = await repository.listSeasonSchedule({ seasonId });
    const rounds = await enrichFinishedScheduleRounds(scheduleRounds, env, { fetch: fetchImpl });
    return jsonResponse({ rounds });
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Unable to load the schedule.' }, 500);
  }
}
