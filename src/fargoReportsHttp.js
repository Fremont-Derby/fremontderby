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
  let rows = [];
  if (base && key) {
    const response = await fetchImpl(withSupabaseSchema(`${base}/rest/v1/fargo_reports?select=player_match_id,status,payload&order=created_at.desc&limit=100`), {
      headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' },
    });
    if (response.ok) rows = await response.json();
  }
  return new Response(renderFargoReportsPage(fargoReportSummary(Array.isArray(rows) ? rows : [])), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
