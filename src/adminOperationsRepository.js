function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function requestJson(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  const body = await parseResponse(response);
  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return { body, response };
}

function totalFrom(response, rows) {
  const contentRange = response.headers.get('content-range') || '';
  const match = contentRange.match(/\/(\d+)$/);
  return match ? Number(match[1]) : (Array.isArray(rows) ? rows.length : 0);
}

export function createAdminOperationsRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const baseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };

  async function rpc(name, body) {
    const result = await requestJson(fetchImpl, `${baseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    return result.body;
  }

  async function table(tableName, query, profile = 'public') {
    const requestHeaders = {
      ...headers,
      prefer: 'count=exact',
      range: '0-0',
      ...(profile === 'private' ? { 'accept-profile': 'private' } : {}),
    };
    const result = await requestJson(
      fetchImpl,
      `${baseUrl}/rest/v1/${tableName}?${query}`,
      { method: 'GET', headers: requestHeaders },
    );
    const rows = Array.isArray(result.body) ? result.body : [];
    return { rows, total: totalFrom(result.response, rows) };
  }

  async function safeMetric(name, task) {
    try {
      const result = await task();
      return [name, { value: result.total, available: true, rows: result.rows }];
    } catch {
      return [name, { value: null, available: false, rows: [] }];
    }
  }

  return {
    async getOverview({ actorUserId }) {
      // Reuse the existing trusted admin-only RPC as the authorization boundary
      // before any service-role aggregate is returned to the caller.
      await rpc('list_chat_message_reports', {
        actor_user_id: actorUserId,
        result_limit: 1,
      });

      const seasons = await table(
        'seasons',
        'select=id,name,status,updated_at&order=updated_at.desc&limit=1',
      );
      const season = seasons.rows[0] ?? null;
      const seasonFilter = season ? `season_id=eq.${encodeURIComponent(season.id)}&` : null;
      const metricTasks = [
        ['profiles', () => table('players', 'select=id&limit=1')],
        ['ratings', () => table('player_ratings', 'select=player_id,updated_at&order=updated_at.desc&limit=1')],
        ['openReports', () => table('chat_message_reports', 'select=id&status=in.(open,reviewing)&limit=1')],
      ];

      if (seasonFilter) {
        metricTasks.push(
          ['seasonPlayers', () => table('season_players', `${seasonFilter}select=id&limit=1`)],
          ['teams', () => table('teams', `${seasonFilter}select=id&limit=1`)],
          ['rounds', () => table('rounds', `${seasonFilter}select=id&limit=1`)],
          ['teamMatches', () => table('team_matches', `${seasonFilter}select=id&limit=1`)],
          ['lineups', () => table('team_lineups', `${seasonFilter}select=id&limit=1`, 'private')],
          ['paidPlayers', () => table('payment_status', `${seasonFilter}status=eq.paid&select=player_id&limit=1`, 'private')],
          ['playerMatches', () => table('player_matches', `${seasonFilter}select=id&limit=1`)],
          ['finalizedMatches', () => table('player_matches', `${seasonFilter}finalized_at=not.is.null&select=id&limit=1`)],
          ['liveMatches', () => table('player_matches', `${seasonFilter}status=in.(active,in_progress,started)&finalized_at=is.null&select=id&limit=1`)],
          ['forfeits', () => table('team_match_forfeits', `${seasonFilter}select=id&limit=1`)],
          ['teamMessages', () => table('team_chat_messages', `${seasonFilter}select=id&limit=1`)],
          ['leagueMessages', () => table('league_chat_messages', `${seasonFilter}select=id&limit=1`)],
          ['directMessages', () => table('direct_messages', `select=id,direct_conversations!inner(season_id)&direct_conversations.season_id=eq.${encodeURIComponent(season.id)}&limit=1`)],
          ['matchupMessages', () => table('matchup_chat_messages', `select=id,team_matches!inner(season_id)&team_matches.season_id=eq.${encodeURIComponent(season.id)}&limit=1`)],
        );
      }

      const entries = await Promise.all(
        metricTasks.map(([name, task]) => safeMetric(name, task)),
      );
      const metrics = Object.fromEntries(entries);
      const latestRatingUpdate = metrics.ratings?.rows?.[0]?.updated_at ?? null;
      for (const metric of Object.values(metrics)) delete metric.rows;

      return {
        generatedAt: new Date().toISOString(),
        season,
        metrics,
        latestRatingUpdate,
      };
    },
  };
}
