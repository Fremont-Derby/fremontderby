import { jsonNoStore } from './httpJson.js';
import { createDateAvailabilityRepository } from './dateAvailabilityRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

const statuses = new Set(['available', 'unsure', 'unavailable']);

const json = jsonNoStore;

export function dateAvailabilityErrorStatus(error) {
  return rpcErrorStatus(error);
}

function normalizeDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('date must be YYYY-MM-DD');
  return value;
}

export async function routeDateAvailability(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/seasons\/([^/]+)\/availability\/me$/);
  if (!match) return null;
  if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);

  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const seasonId = decodeURIComponent(match[1]);
    const repository = createDateAvailabilityRepository(env, { fetch: fetchImpl });

    if (request.method === 'GET') {
      const availabilityDate = normalizeDate(url.searchParams.get('date'));
      return json({ availability: await repository.getOwn({ actorUserId: actor.id, seasonId, availabilityDate }) });
    }

    const body = await request.json();
    const availabilityDate = normalizeDate(body.date ?? body.availabilityDate);
    const availabilityStatus = String(body.status ?? body.availabilityStatus ?? body.availability_status ?? '').toLowerCase();
    if (!statuses.has(availabilityStatus)) {
      throw new Error('status must be available, unsure, or unavailable');
    }
    if (String(env?.ENVIRONMENT || '').trim() === 'dru') {
      const { activeSeasonCanCheckIn } = await import('./activeCheckIn.js');
      const { withSupabaseSchema } = await import('./supabaseSchema.js');
      const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
      const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
      const key = env.SUPABASE_SERVICE_ROLE_KEY;
      const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json' };
      const seasonResponse = await fetchWithSchema(`${base}/rest/v1/seasons?id=eq.${seasonId}&select=status`, { headers });
      const season = seasonResponse.ok ? (await seasonResponse.json())?.[0] : null;
      const playerResponse = await fetchWithSchema(`${base}/rest/v1/players?user_id=eq.${actor.id}&select=id`, { headers });
      const player = playerResponse.ok ? (await playerResponse.json())?.[0] : null;
      const memberResponse = player ? await fetchWithSchema(`${base}/rest/v1/team_memberships?season_id=eq.${seasonId}&player_id=eq.${player.id}&ends_at=is.null&select=id`, { headers }) : null;
      const rostered = memberResponse?.ok ? (await memberResponse.json()).length > 0 : false;
      if (activeSeasonCanCheckIn(season?.status, rostered)) {
        await fetchWithSchema(`${base}/rest/v1/season_players`, { method: 'POST', headers: { ...headers, prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ season_id: seasonId, player_id: player.id, status: 'active' }) });
      }
    }
    return json({
      availability: await repository.setOwn({
        actorUserId: actor.id,
        seasonId,
        availabilityDate,
        availabilityStatus,
      }),
    });
  } catch (error) {
    return json({ error: safeClientErrorMessage(error) }, dateAvailabilityErrorStatus(error));
  }
}
