export function fargoIdLooksValid(value) {
  return /^[0-9]{3,12}$/.test(String(value || '').trim());
}

import { fargoReportSummary, missingFargoLinks, withoutMissing } from './fargoReportStore.js';
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
    if (playerId && fargoId && !fargoIdLooksValid(fargoId)) saved = 'Fargo id must be 3 to 12 digits.';
    else if (playerId && fargoId) {
      const savedId = await fetchImpl(`${base}/rest/v1/player_external_identities?on_conflict=provider,external_id`, {
        method: 'POST',
        headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', 'content-profile': 'public', 'accept-profile': 'public', prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ player_id: playerId, provider: 'fargo', external_id: fargoId }),
      });
      const evidence = await fetchImpl(`${base}/rest/v1/external_tournament_events?on_conflict=source,external_event_id`, {
        method: 'POST',
        headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', 'content-profile': 'public', 'accept-profile': 'public', prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ source: 'other', external_event_id: `fargo-id:${playerId}`, name: 'Fargo id', provenance: { kind: 'fargo-id', playerId, fargoId } }),
      });
      saved = savedId.ok || evidence.ok ? `Fargo id saved for ${playerId}.` : `Fargo id was not saved for ${playerId}.`;
    }
    if (challongeUrl) saved = saved || 'Challonge link noted. A live send still needs a Challonge key.';
  }
  let rows = [];
  let reportStore = 'unavailable';
  try {
    if (base && key) {
      const read = withSupabaseSchema(fetchImpl, env);
      const response = await read(`${base}/rest/v1/fargo_reports?select=player_match_id,status,payload&order=created_at.desc&limit=100`, {
        headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'accept-profile': 'public' },
      });
      if (response.ok) { rows = await response.json(); reportStore = 'ready'; }
      if (!rows.length) {
        const evidence = await read(`${base}/rest/v1/external_tournament_events?source=eq.other&external_event_id=like.fargo-report:*&select=provenance&limit=100`, {
          headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'accept-profile': 'public' },
        });
        if (evidence.ok) {
          rows = (await evidence.json()).map((row) => ({ status: row.provenance?.status || 'not_sent', player_match_id: row.provenance?.playerMatchId, payload: row.provenance || {} }));
          reportStore = rows.length ? 'ready' : reportStore;
        }
      }
    }
  } catch {
    reportStore = 'unavailable';
  }
  const summary = fargoReportSummary(Array.isArray(rows) ? rows : []);
  if (!summary.missingLinks.length || !summary.unreported.length) {
    const { loadFinalizedMatches } = await import('./fargoFeedHttp.js');
    const matches = await loadFinalizedMatches(env, fetchImpl);
    if (!summary.missingLinks.length) summary.missingLinks = missingFargoLinks(matches);
    if (!summary.unreported.length) {
      summary.unreported = matches.map((match) => ({ status: 'not_sent', player_match_id: match.playerMatchId, payload: { playerAName: match.playerAName, playerBName: match.playerBName } }));
      reportStore = 'ready';
    }
  }
  summary.unreported = withoutMissing(summary.unreported, summary.missingLinks);
  return new Response(renderFargoReportsPage(summary, { feedUrl: '/api/fargo/feed', saved, reportStore }), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
