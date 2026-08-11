import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminOperationsOverview } from '../src/adminOperationsHttp.js';
import { createAdminOperationsRepository } from '../src/adminOperationsRepository.js';

const readiness = {
  ok: true,
  environment: 'production',
  supabase: { projectRef: 'cpiucsxlkicmlbvdvhww' },
};

function metrics(values) {
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [
    name, { value, available: value !== null },
  ]));
}

function healthyMetrics(overrides = {}) {
  return metrics({
    profiles: 24, seasonPlayers: 24, teams: 8, paidPlayers: 24,
    ratings: 24, openReports: 0, liveMatches: 0,
    rounds: 7, teamMatches: 28, lineups: 16, playerMatches: 84,
    finalizedMatches: 0, scoreMismatches: 0, forfeits: 0,
    teamMessages: 0, directMessages: 0, leagueMessages: 0, matchupMessages: 0,
    ...overrides,
  });
}

function overviewAt(startedAt, generatedAt = '2026-08-11T12:00:00Z') {
  return buildAdminOperationsOverview({
    generatedAt,
    season: { id: 'season-1', name: 'Season 1', status: 'active' },
    oldestLiveMatchStartedAt: startedAt,
    latestRatingUpdate: generatedAt,
    metrics: healthyMetrics({ liveMatches: 1 }),
  }, readiness);
}

test('operations warns when a started match remains unfinalized for 90 minutes', () => {
  const overview = overviewAt('2026-08-11T10:29:00Z');
  assert.equal(overview.overall, 'warning');
  assert.equal(overview.actions[0].code, 'match_unfinalized_aging');
  assert.equal(overview.actions[0].href, '/scorecard');
  assert.match(overview.actions[0].detail, /91 minutes/);
});

test('operations escalates a started match still unfinalized after 150 minutes', () => {
  const overview = overviewAt('2026-08-11T09:29:00Z');
  assert.equal(overview.overall, 'critical');
  assert.equal(overview.actions[0].code, 'match_unfinalized_overdue');
  assert.match(overview.actions[0].detail, /151 minutes/);
});

test('operations does not warn on an ordinary live match before 90 minutes', () => {
  const overview = overviewAt('2026-08-11T10:31:00Z');
  assert.equal(overview.counts.liveMatches, 1);
  assert.equal(overview.overall, 'healthy');
  assert.deepEqual(overview.actions, []);
});

test('repository derives live match start from first non-empty private team score submission', async () => {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes('/rpc/list_chat_message_reports')) return Response.json([]);
    if (url.includes('/seasons?')) {
      return Response.json([{ id: 'season-1', name: 'Season 1', status: 'active' }]);
    }
    if (url.includes('/rounds?') && url.includes('status=in.')) return Response.json([]);
    if (url.includes('/player_matches?') && url.includes('status=not.in.')) {
      return Response.json([{ id: 'match-started' }, { id: 'match-not-started' }]);
    }
    if (url.includes('/player_match_score_submissions?')) {
      return Response.json([
        { player_match_id: 'match-started', racks: [{ winnerSide: 'A' }], created_at: '2026-08-11T10:15:00Z', updated_at: '2026-08-11T10:20:00Z' },
        { player_match_id: 'match-started', racks: [{ winnerSide: 'A' }], created_at: '2026-08-11T10:17:00Z', updated_at: '2026-08-11T10:21:00Z' },
        { player_match_id: 'match-not-started', racks: [], created_at: '2026-08-11T09:00:00Z', updated_at: '2026-08-11T09:00:00Z' },
        { player_match_id: 'match-finalized', racks: [{ winnerSide: 'B' }], created_at: '2026-08-11T08:00:00Z', updated_at: '2026-08-11T08:01:00Z' },
      ]);
    }
    return new Response('[]', { status: 200, headers: { 'content-range': '*/0' } });
  };

  const repository = createAdminOperationsRepository({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: ['test', 'key'].join('-'),
  }, { fetch });
  const result = await repository.getOverview({ actorUserId: 'admin-1' });

  assert.equal(result.metrics.liveMatches.available, true);
  assert.equal(result.metrics.liveMatches.value, 1);
  assert.equal(result.oldestLiveMatchStartedAt, '2026-08-11T10:15:00.000Z');
  const submissionCalls = calls.filter(({ url }) => url.includes('/player_match_score_submissions?'));
  assert.equal(submissionCalls.length, 1);
  assert.equal(submissionCalls[0].init.headers['accept-profile'], 'private');
});
