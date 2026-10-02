import { publishPlayerMatchCandidateA, challongeConfigured } from './challongePublish.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

export async function handleChallongePublishDryRunRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await request.json().catch(() => ({}));
    if (!body.playerMatchId) {
      return Response.json({ error: 'playerMatchId is required' }, { status: 400, headers: { 'cache-control': 'no-store' } });
    }
    // Always dry-run from this endpoint until product enables live publish with explicit flag.
    const live = body.live === true && String(env.CHALLONGE_LIVE_PUBLISH || '') === '1';
    const result = await publishPlayerMatchCandidateA(env, body, {
      dryRun: !live,
      fetchImpl,
    });
    return Response.json(
      {
        ...result,
        configured: challongeConfigured(env),
        liveAttempted: live,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    const status = error instanceof AuthError ? error.status : rpcErrorStatus(error);
    return Response.json(
      { error: safeClientErrorMessage(error) },
      { status: status || 500, headers: { 'cache-control': 'no-store' } },
    );
  }
}
