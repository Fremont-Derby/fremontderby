import { authenticateSupabaseUser } from './supabaseAuth.js';
import { withSupabaseSchema } from './supabaseSchema.js';
import { renderJflProvisionalSeedPage } from './jflProvisionalSeedPage.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

export async function routeJflProvisionalSeed(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (env.ENVIRONMENT !== 'jfl') return null;
  const path = new URL(request.url).pathname;
  if (path === '/admin/provisional-rating') {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    return new Response(renderJflProvisionalSeedPage(), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  const match = path.match(/^\/api\/admin\/players\/([^/]+)\/provisional-seed$/);
  if (!match) return null;
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
  const playerId = match[1];
  if (!uuid.test(playerId)) return json({ error: 'A valid player is required' }, 400);
  // This administrative surface always requires validated bearer authentication,
  // including when other isolated-lane routes allow deliberate no-auth automation.
  if (!/^Bearer\s+\S+$/i.test(request.headers.get('authorization') || '')) return json({ error: 'Open Profile and sign in again' }, 401);
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    let body;
    if (request.method === 'POST') {
      try { body = await request.json(); } catch { return json({ error: 'A JSON rating and reason are required' }, 400); }
      if (typeof body?.ratingValue !== 'number' || !Number.isInteger(body.ratingValue)
        || body.ratingValue < 0 || body.ratingValue > 1000) return json({ error: 'Enter a whole-number rating from 0 to 1000' }, 400);
      if (typeof body.reason !== 'string' || !body.reason.trim() || body.reason.trim().length > 500) {
        return json({ error: 'A reason from 1 to 500 characters is required' }, 400);
      }
    }
    const scopedFetch = withSupabaseSchema(fetchImpl, env);
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key || !env.SUPABASE_URL) throw new Error('Seed service unavailable');
    const name = request.method === 'GET' ? 'get_admin_provisional_seed' : 'record_admin_provisional_seed';
    const args = { actor_user_id: actor.id, target_player_id: playerId,
      ...(body ? { seed_value: body.ratingValue, seed_reason: body.reason.trim() } : {}) };
    const response = await scopedFetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/rpc/${name}`, {
      method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(args),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const status = result?.code === '42501' ? 403 : result?.code === 'P0002' ? 404
        : result?.code === '23514' ? 409 : result?.code === '22023' ? 400 : 503;
      const message = status === 403 ? 'Only a league admin can manage provisional seeds'
        : status === 404 ? 'Player not found' : status === 409 ? 'An established seed cannot be replaced by a provisional value'
          : status === 400 ? 'The rating or reason is invalid' : 'Seed service unavailable. Reload before trying again.';
      return json({ error: message }, status);
    }
    if (!result || result.playerId !== playerId) return json({ error: 'Seed response could not be confirmed. Reload before trying again.' }, 502);
    if (body && (result.ratingValue !== body.ratingValue || result.source !== 'admin_provisional' || result.ratingStatus !== 'provisional'
      || result.reason !== body.reason.trim() || !uuid.test(result.eventId || '') || !Number.isFinite(Date.parse(result.effectiveAt)))) {
      return json({ error: 'Seed response could not be confirmed. Reload before trying again.' }, 502);
    }
    return json({ seed: result });
  } catch (error) {
    const status = error.status === 401 || error.name === 'AuthError' ? 401 : 503;
    return json({ error: status === 401 ? 'Open Profile and sign in again' : 'Seed service unavailable. Reload before trying again.' }, status);
  }
}

export async function enhanceJflProvisionalSeedLink(response, env, path) {
  if (env.ENVIRONMENT !== 'jfl' || path !== '/admin/players'
    || !response.headers.get('content-type')?.includes('text/html')) return response;
  const html = await response.text();
  return new Response(html.replace('</main>', '<p><a href="/admin/provisional-rating">Manage provisional rating seeds</a></p></main>'), {
    status: response.status, headers: response.headers,
  });
}
