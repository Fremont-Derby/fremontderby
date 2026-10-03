async function finishedDruChampionship(env, seasonId, fetchImpl) {
  if (String(env?.ENVIRONMENT || '').trim() !== 'dru') return false;
  const { withSupabaseSchema } = await import('./supabaseSchema.js');
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return false;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' };
  const rounds = await fetchWithSchema(`${base}/rest/v1/rounds?season_id=eq.${seasonId}&stage=eq.championship&select=id`, { headers });
  const roundIds = rounds.ok ? (await rounds.json()).map((row) => row.id).filter(Boolean) : [];
  if (!roundIds.length) return false;
  const matches = await fetchWithSchema(`${base}/rest/v1/team_matches?round_id=in.(${roundIds.join(',')})&status=eq.finalized&select=id`, { headers });
  return matches.ok && (await matches.json()).length > 0;
}
