import { fargoReportSummary } from './fargoReportStore.js';
import { renderFargoReportsPage } from './fargoReportsPage.js';
import { withSupabaseSchema } from './supabaseSchema.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

export async function handleFargoReportsPage(request, env = {}, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 401;
    return new Response('Sign in to review Fargo reports.', { status, headers: { 'content-type': 'text/plain' } });
  }
  const base = stripTrailingSlashes(env?.SUPABASE_URL || '');
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  let saved = '';
  if (request.method === 'POST' && base && key) {
    const form = await request.formData();
    const write = withSupabaseSchema(fetchImpl, env);
    const playerId = String(form.get('playerId') || '').trim();
    const fargoId = String(form.get('fargoId') || '').trim();
    const challongeUrl = String(form.get('challongeUrl') || '').trim();
    if (playerId && fargoId) {
      await write(`${base}/rest/v1/player_external_identities`, {
        method: 'POST',
        headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ player_id: playerId, provider: 'fargo', external_id: fargoId }),
      });
      saved = 'Fargo id saved.';
    }
    if (challongeUrl) saved = saved || 'Challonge link noted. A live send still needs a Challonge key.';
  }
  let rows = [];
  if (base && key) {
    const request = withSupabaseSchema(fetchImpl, env);
    const response = await request(`${base}/rest/v1/fargo_reports?select=player_match_id,status,payload&order=created_at.desc&limit=100`, {
      headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' },
    });
    if (response.ok) rows = await response.json();
  }
  return new Response(renderFargoReportsPage(fargoReportSummary(Array.isArray(rows) ? rows : []), { feedUrl: '/api/fargo/feed', saved, reportStore: response && response.ok ? 'ready' : 'unavailable' }), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
