import {
  getOwnSeasonRegistrationCommand,
  registerForSeasonCommand,
} from './seasonRegistrationCommands.js';
import { createSeasonRegistrationRepository } from './seasonRegistrationRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

export function playerSeasonRegistrationErrorStatus(error) {
  return rpcErrorStatus(error);
}

function normalizeRegistration(registration) {
  if (!registration) return null;
  return {
    participationType: registration.participation_type ?? registration.participationType ?? null,
    registrationStatus: registration.registration_status ?? registration.registrationStatus ?? null,
    registeredAt: registration.registered_at ?? registration.registeredAt ?? null,
    paymentStatus: registration.payment_status ?? registration.paymentStatus ?? 'unpaid',
    amountDueCents: registration.amount_due_cents ?? registration.amountDueCents ?? 0,
    amountPaidCents: registration.amount_paid_cents ?? registration.amountPaidCents ?? 0,
  };
}

export async function routePlayerSeasonRegistration(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/seasons\/([^/]+)\/registration\/me$/);
  if (!match) return null;
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);

  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const seasonId = decodeURIComponent(match[1]);
    const repository = createSeasonRegistrationRepository(env, { fetch: fetchImpl });

    if (request.method === 'GET') {
      const registration = await getOwnSeasonRegistrationCommand(
        { actorUserId: actor.id, seasonId },
        repository,
      );
      return json({ registration: normalizeRegistration(registration) });
    }

    const body = await request.json().catch(() => ({}));
    const registration = await registerForSeasonCommand(
      {
        actorUserId: actor.id,
        seasonId,
        participationType: body.participationType ?? body.participation_type ?? 'free_agent',
      },
      repository,
    );
    return json({ registration: normalizeRegistration(registration) }, 201);
  } catch (error) {
    return json({ error: safeClientErrorMessage(error) }, playerSeasonRegistrationErrorStatus(error));
  }
}
