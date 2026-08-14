import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import {
  getAdminPlayerContactCommand,
  getOwnPlayerContactCommand,
  setOwnPlayerContactCommand,
} from './playerContactCommands.js';
import { createPlayerContactRepository } from './playerContactRepository.js';

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store, no-cache, private',
      pragma: 'no-cache',
      // WHY: contact payloads must never be shared or bf-cached.
      vary: 'Authorization',
    },
  });
}

export function playerContactErrorStatus(error) {
  if (error instanceof AuthError) return error.status;
  if (/Actor is not a league admin/i.test(error.message)) return 403;
  if (/Player profile is required|Player not found/i.test(error.message)) return 404;
  if (/Active captains must keep/i.test(error.message)) return 409;
  if (/required|phone number|phone must/i.test(error.message)) return 400;
  if (error.message.startsWith('Supabase request failed with 401')) return 401;
  if (error.message.startsWith('Supabase request failed with 403')) return 403;
  return 502;
}

/** Mask to last 4 digits only — never echo full phone unless explicitly revealed. */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const last = digits.slice(-4);
  return `••••${last}`;
}

/**
 * @param {object|null} contact
 * @param {{ reveal?: boolean }} [options]
 */
export function normalizeContact(contact, options = {}) {
  if (!contact) {
    return { phone: null, phoneMasked: null, hasPhone: false };
  }
  const raw = contact.phone ?? null;
  const hasPhone = Boolean(contact.has_phone ?? contact.hasPhone ?? raw);
  const phoneMasked = hasPhone ? maskPhone(raw) || '••••' : null;
  if (options.reveal) {
    return { phone: raw, phoneMasked, hasPhone };
  }
  // WHY: default responses omit the full number so shoulder-surfing and casual
  // network inspection do not expose contact details on profile load.
  return { phone: null, phoneMasked, hasPhone };
}

export async function routePlayerContact(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  const url = new URL(request.url);
  const own = url.pathname === '/api/me/contact';
  const adminMatch = url.pathname.match(/^\/api\/admin\/players\/([^/]+)\/contact$/);
  if (!own && !adminMatch) return null;
  if (own && !['GET', 'PUT'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
  if (adminMatch && request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const reveal = url.searchParams.get('reveal') === '1' || url.searchParams.get('reveal') === 'true';

  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createPlayerContactRepository(env, { fetch: fetchImpl });

    if (adminMatch) {
      const contact = await getAdminPlayerContactCommand({
        actorUserId: actor.id,
        playerId: decodeURIComponent(adminMatch[1]),
      }, repository);
      if (!contact) return json({ error: 'Player not found' }, 404);
      return json({
        contact: {
          playerId: contact.player_id ?? contact.playerId,
          displayName: contact.display_name ?? contact.displayName,
          ...normalizeContact(contact, { reveal }),
        },
      });
    }

    if (request.method === 'GET') {
      const contact = await getOwnPlayerContactCommand({ actorUserId: actor.id }, repository);
      return json({ contact: normalizeContact(contact, { reveal }) });
    }

    const body = await request.json().catch(() => ({}));
    const contact = await setOwnPlayerContactCommand({
      actorUserId: actor.id,
      phone: body.phone ?? null,
    }, repository);
    // After save, still default to masked in the response body.
    return json({ contact: normalizeContact(contact, { reveal: false }) });
  } catch (error) {
    return json({ error: error.message }, playerContactErrorStatus(error));
  }
}
