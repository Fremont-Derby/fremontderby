import {
  getOwnSeasonRegistrationCommand,
  registerForSeasonCommand,
} from './seasonRegistrationCommands.js';
import { createSeasonRegistrationRepository } from './seasonRegistrationRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

export function playerSeasonRegistrationErrorStatus(error) {
  if (error instanceof AuthError) return error.status;
  if (error.message.includes('Season not found')) return 404;
  if (error.message.includes('Season registration is not open')) return 409;
  if (error.message.includes('Player profile is required')) return 409;
  if (error.message.includes('Active team membership is required')) return 409;
  if (error.message.includes('Rostered players cannot register as free agents')) return 409;
  if (error.message.startsWith('Supabase request failed with 401')) return 401;
  if (error.message.startsWith('Supabase request failed with 403')) return 403;
  return 400;
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
    return json({ error: error.message }, playerSeasonRegistrationErrorStatus(error));
  }
}
