import { reviewTeamApplicationCommand } from './teamRegistrationCommands.js';
import { createTeamRegistrationRepository } from './teamRegistrationRepository.js';

const words = {
  approved: 'approve',
  approve: 'approve',
  deferred: 'defer',
  defer: 'defer',
  rejected: 'reject',
  declined: 'reject',
  reject: 'reject',
};

export function reviewDecisionWord(raw) {
  const key = String(raw ?? '').toLowerCase().trim();
  return words[key] || key;
}

export async function routeDruReviewWord(request, env) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/admin\/team-applications\/([^/]+)\/respond$/);
  if (!match || request.method !== 'POST') return null;
  if (String(env?.ENVIRONMENT || '').trim() !== 'dru') return null;
  try {
    const { authenticateSupabaseUser } = await import('./supabaseAuth.js');
    const actor = await authenticateSupabaseUser(request, env);
    const body = await request.json().catch(() => ({}));
    const repository = createTeamRegistrationRepository(env);
    const application = await reviewTeamApplicationCommand(
      {
        actorUserId: actor.id,
        applicationId: decodeURIComponent(match[1]),
        decision: reviewDecisionWord(body.decision ?? body.response ?? body.action),
        reason: body.reason ?? body.note ?? '',
      },
      repository,
    );
    return Response.json({ application });
  } catch (error) {
    const message = error?.message || 'Request failed';
    const status = /must be approve/.test(message) ? 400 : (error.status || 400);
    return Response.json({ error: message }, { status });
  }
}
