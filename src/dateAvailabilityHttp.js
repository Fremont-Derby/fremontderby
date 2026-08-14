import { createDateAvailabilityRepository } from './dateAvailabilityRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

const statuses = new Set(['available', 'unsure', 'unavailable']);

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

export function dateAvailabilityErrorStatus(error) {
  if (error instanceof AuthError) return error.status;
  if (error.message.includes('Active season registration is required')) return 409;
  if (error.message.includes('not a scheduled league date')) return 409;
  if (error.message.startsWith('Supabase request failed with 401')) return 401;
  if (error.message.startsWith('Supabase request failed with 403')) return 403;
  return 400;
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
    const availabilityStatus = String(body.status ?? body.availabilityStatus ?? '').toLowerCase();
    if (!statuses.has(availabilityStatus)) {
      throw new Error('status must be available, unsure, or unavailable');
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
    return json({ error: error.message }, dateAvailabilityErrorStatus(error));
  }
}
