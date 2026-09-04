import { withSupabaseSchema } from './supabaseSchema.js';
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

function timestampMs(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreMismatchSummary(matchRows, submissionRows) {
  const unresolvedMatchIds = new Set(matchRows.map((row) => row.id));
  const submissionsByMatch = new Map();
  for (const submission of submissionRows) {
    if (!unresolvedMatchIds.has(submission.player_match_id)) continue;
    const submissions = submissionsByMatch.get(submission.player_match_id) || [];
    submissions.push(submission);
    submissionsByMatch.set(submission.player_match_id, submissions);
  }

  const mismatches = [];
  for (const [playerMatchId, submissions] of submissionsByMatch) {
    if (submissions.length !== 2) continue;
    if (JSON.stringify(submissions[0].racks) === JSON.stringify(submissions[1].racks)) continue;
    const updatedTimes = submissions.map((row) => timestampMs(row.updated_at));
    if (updatedTimes.some((value) => value === null)) continue;
    mismatches.push({
      playerMatchId,
      mismatchSince: new Date(Math.max(...updatedTimes)).toISOString(),
    });
  }

  mismatches.sort((a, b) => Date.parse(a.mismatchSince) - Date.parse(b.mismatchSince));
  return { total: mismatches.length, rows: mismatches };
}

function liveMatchSummary(matchRows, submissionRows) {
  const unresolvedMatchIds = new Set(matchRows.map((row) => row.id));
  const startedAtByMatch = new Map();

  for (const submission of submissionRows) {
    if (!unresolvedMatchIds.has(submission.player_match_id)) continue;
    if (!Array.isArray(submission.racks) || submission.racks.length === 0) continue;
    const startedAt = timestampMs(submission.created_at);
    if (startedAt === null) continue;
    const existing = startedAtByMatch.get(submission.player_match_id);
    if (existing === undefined || startedAt < existing) {
      startedAtByMatch.set(submission.player_match_id, startedAt);
    }
  }

  const rows = [...startedAtByMatch.entries()]
    .map(([playerMatchId, startedAt]) => ({
      playerMatchId,
      startedAt: new Date(startedAt).toISOString(),
    }))
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  return { total: rows.length, rows };
}

function selectedIneligibleSummary(slotRows, paymentRows) {
  const playablePlayerIds = new Set(
    paymentRows
      .filter((row) => row.status === 'paid' || row.status === 'waived')
      .map((row) => row.player_id),
  );
  const selectedPlayerIds = new Set(
    slotRows.map((row) => row.player_id).filter(Boolean),
  );
  const rows = [...selectedPlayerIds]
    .filter((playerId) => !playablePlayerIds.has(playerId))
    .map((playerId) => ({ playerId }));
  return { total: rows.length, rows };
}

export function createAdminOperationsRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);
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

  function profileHeaders(profile) {
    return profile === 'private' ? { 'accept-profile': 'private' } : {};
  }

  async function table(tableName, query, profile = 'public') {
    const requestHeaders = {
      ...headers,
      prefer: 'count=exact',
      range: '0-0',
      ...profileHeaders(profile),
    };
    const result = await requestJson(
      fetchImpl,
      `${baseUrl}/rest/v1/${tableName}?${query}`,
      { method: 'GET', headers: requestHeaders },
    );
    const rows = Array.isArray(result.body) ? result.body : [];
    return { rows, total: totalFrom(result.response, rows) };
  }

  async function tableRows(tableName, query, profile = 'public') {
    const result = await requestJson(
      fetchImpl,
      `${baseUrl}/rest/v1/${tableName}?${query}`,
      { method: 'GET', headers: { ...headers, ...profileHeaders(profile) } },
    );
    return Array.isArray(result.body) ? result.body : [];
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
      await rpc('list_chat_message_reports', {
        actor_user_id: actorUserId,
        result_limit: 1,
      });

      const activeSeasons = await table(
        'seasons',
        'select=id,name,status,updated_at&status=eq.active&order=updated_at.desc&limit=1',
      );
      const seasons = activeSeasons.rows.length
        ? activeSeasons
        : await table(
          'seasons',
          'select=id,name,status,updated_at&order=updated_at.desc&limit=1',
        );
      const season = seasons.rows[0] ?? null;
      const seasonFilter = season ? `season_id=eq.${encodeURIComponent(season.id)}&` : null;
      let currentRound = null;
      if (seasonFilter) {
        const currentRounds = await table(
          'rounds',
          `${seasonFilter}status=in.(scheduled,in_progress)&select=id,round_number,stage,scheduled_on,status,lineup_deadline_at&order=round_number.asc&limit=1`,
        );
        currentRound = currentRounds.rows[0] ?? null;
      }

      const metricTasks = [
        ['profiles', () => table('players', 'select=id&limit=1')],
        ['ratings', () => table('player_ratings', 'select=player_id,updated_at&order=updated_at.desc&limit=1')],
        ['openReports', () => table('chat_message_reports', 'select=id&status=in.(open,reviewing)&limit=1')],
      ];

      if (seasonFilter) {
        const unresolvedMatchesPromise = tableRows(
          'player_matches',
          `${seasonFilter}status=not.in.(finalized,corrected)&select=id`,
        );
        const scoreSubmissionsPromise = tableRows(
          'player_match_score_submissions',
          `${seasonFilter}select=player_match_id,racks,created_at,updated_at`,
          'private',
        );

        metricTasks.push(
          ['seasonPlayers', () => table('season_players', `${seasonFilter}select=id&limit=1`)],
          ['teams', () => table('teams', `${seasonFilter}select=id&limit=1`)],
          ['rounds', () => table('rounds', `${seasonFilter}select=id&limit=1`)],
          ['teamMatches', () => table('team_matches', `${seasonFilter}select=id&limit=1`)],
          ['lineups', () => table('team_lineups', `${seasonFilter}select=id&limit=1`, 'private')],
          ['paidPlayers', () => table('payment_status', `${seasonFilter}status=in.(paid,waived)&select=player_id&limit=1`, 'private')],
          ['playerMatches', () => table('player_matches', `${seasonFilter}select=id&limit=1`)],
          ['finalizedMatches', () => table('player_matches', `${seasonFilter}finalized_at=not.is.null&select=id&limit=1`)],
          ['liveMatches', async () => {
            const [matchRows, submissionRows] = await Promise.all([
              unresolvedMatchesPromise,
              scoreSubmissionsPromise,
            ]);
            return liveMatchSummary(matchRows, submissionRows);
          }],
          ['scoreMismatches', async () => {
            const [matchRows, submissionRows] = await Promise.all([
              unresolvedMatchesPromise,
              scoreSubmissionsPromise,
            ]);
            return scoreMismatchSummary(matchRows, submissionRows);
          }],
          ['forfeits', () => table('team_match_forfeits', `${seasonFilter}select=id&limit=1`)],
          ['teamMessages', () => table('team_chat_messages', `${seasonFilter}select=id&limit=1`)],
          ['leagueMessages', () => table('league_chat_messages', `${seasonFilter}select=id&limit=1`)],
          ['directMessages', () => table('direct_messages', `select=id,direct_conversations!inner(season_id)&direct_conversations.season_id=eq.${encodeURIComponent(season.id)}&limit=1`)],
          ['matchupMessages', () => table('matchup_chat_messages', `select=id,team_matches!inner(season_id)&team_matches.season_id=eq.${encodeURIComponent(season.id)}&limit=1`)],
        );
      }

      if (currentRound) {
        const roundFilter = `round_id=eq.${encodeURIComponent(currentRound.id)}&`;
        const selectedSlotsPromise = tableRows(
          'team_lineup_slots',
          `${roundFilter}player_id=not.is.null&select=player_id`,
          'private',
        );
        const eligiblePaymentsPromise = tableRows(
          'payment_status',
          `${seasonFilter}status=in.(paid,waived)&select=player_id,status`,
          'private',
        );
        metricTasks.push(
          ['currentRoundTeamMatches', () => table('team_matches', `${roundFilter}select=id&limit=1`)],
          ['currentRoundLineups', () => table('team_lineups', `${roundFilter}select=id&limit=1`, 'private')],
          ['selectedIneligiblePlayers', async () => {
            const [slotRows, paymentRows] = await Promise.all([
              selectedSlotsPromise,
              eligiblePaymentsPromise,
            ]);
            return selectedIneligibleSummary(slotRows, paymentRows);
          }],
          ['rosterAvailabilityResponses', () => table('roster_availability', `${roundFilter}select=player_id&limit=1`, 'private')],
          ['availableRosterResponses', () => table('roster_availability', `${roundFilter}status=eq.available&select=player_id&limit=1`, 'private')],
          ['unsureRosterResponses', () => table('roster_availability', `${roundFilter}status=eq.unsure&select=player_id&limit=1`, 'private')],
          ['unavailableRosterResponses', () => table('roster_availability', `${roundFilter}status=eq.unavailable&select=player_id&limit=1`, 'private')],
          ['availableFreeAgents', () => table('free_agent_availability', `${roundFilter}status=eq.available&select=player_id&limit=1`, 'private')],
        );
      }

      const entries = await Promise.all(
        metricTasks.map(([name, task]) => safeMetric(name, task)),
      );
      const metrics = Object.fromEntries(entries);
      const latestRatingUpdate = metrics.ratings?.rows?.[0]?.updated_at ?? null;
      const oldestLiveMatchStartedAt = metrics.liveMatches?.rows?.[0]?.startedAt ?? null;
      const oldestScoreMismatchAt = metrics.scoreMismatches?.rows?.[0]?.mismatchSince ?? null;
      for (const metric of Object.values(metrics)) delete metric.rows;

      return {
        generatedAt: new Date().toISOString(),
        season,
        currentRound,
        metrics,
        latestRatingUpdate,
        oldestLiveMatchStartedAt,
        oldestScoreMismatchAt,
      };
    },
  };
}
