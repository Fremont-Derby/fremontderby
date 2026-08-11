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

function roundOverview({ generatedAt, deadline, currentRoundLineups }) {
  return buildAdminOperationsOverview({
    generatedAt,
    season: { id: 'season-1', name: 'Season 1', status: 'active' },
    currentRound: {
      id: 'round-3', round_number: 3, stage: 'regular', status: 'scheduled',
      lineup_deadline_at: deadline,
    },
    latestRatingUpdate: generatedAt,
    metrics: metrics({
      profiles: 24, seasonPlayers: 24, teams: 8, paidPlayers: 24,
      ratings: 24, openReports: 0, liveMatches: 0,
      rounds: 7, teamMatches: 28, lineups: 20, playerMatches: 36,
      finalizedMatches: 36, forfeits: 0, teamMessages: 0,
      directMessages: 0, leagueMessages: 0, matchupMessages: 0,
      currentRoundTeamMatches: 4, currentRoundLineups,
      rosterAvailabilityResponses: 12, availableRosterResponses: 12,
      unsureRosterResponses: 0, unavailableRosterResponses: 0,
      availableFreeAgents: 1,
    }),
  }, readiness);
}

test('admin operations warns when current-round lineups are incomplete within two hours', () => {
  const overview = roundOverview({
    generatedAt: '2026-08-11T17:00:00Z',
    deadline: '2026-08-11T18:30:00Z',
    currentRoundLineups: 6,
  });

  const item = overview.actions.find((action) => action.code === 'lineups_due_soon');
  assert.ok(item);
  assert.equal(item.severity, 'warning');
  assert.equal(item.href, '/lineup');
  assert.match(item.detail, /Round 3/);
  assert.match(item.detail, /missing 2 of 8/);
});

test('admin operations escalates incomplete current-round lineups after deadline', () => {
  const overview = roundOverview({
    generatedAt: '2026-08-11T19:00:00Z',
    deadline: '2026-08-11T18:30:00Z',
    currentRoundLineups: 7,
  });

  const item = overview.actions.find((action) => action.code === 'lineups_overdue');
  assert.ok(item);
  assert.equal(item.severity, 'critical');
  assert.equal(overview.overall, 'critical');
  assert.match(item.detail, /missing 1 of 8/);
});

test('admin operations does not warn before the two-hour window or after all lineups arrive', () => {
  const early = roundOverview({
    generatedAt: '2026-08-11T15:00:00Z',
    deadline: '2026-08-11T18:30:00Z',
    currentRoundLineups: 6,
  });
  const complete = roundOverview({
    generatedAt: '2026-08-11T19:00:00Z',
    deadline: '2026-08-11T18:30:00Z',
    currentRoundLineups: 8,
  });

  assert.equal(early.actions.some((action) => action.code.startsWith('lineups_')), false);
  assert.equal(complete.actions.some((action) => action.code.startsWith('lineups_')), false);
});

test('admin operations repository scopes lineup readiness metrics to the current round', async () => {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes('/rpc/list_chat_message_reports')) return Response.json([]);
    if (url.includes('/seasons?')) {
      return Response.json([{ id: 'season-1', name: 'Season 1', status: 'active' }]);
    }
    if (url.includes('/rounds?') && url.includes('status=in.')) {
      return Response.json([{
        id: 'round-3', round_number: 3, stage: 'regular', status: 'scheduled',
        lineup_deadline_at: '2026-08-11T18:30:00Z',
      }]);
    }
    return new Response('[]', { status: 200, headers: { 'content-range': '*/0' } });
  };

  const repository = createAdminOperationsRepository({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
  }, { fetch });
  await repository.getOverview({ actorUserId: 'admin-1' });

  const teamMatchCall = calls.find(({ url }) =>
    url.includes('/team_matches?round_id=eq.round-3'));
  const lineupCall = calls.find(({ url }) =>
    url.includes('/team_lineups?round_id=eq.round-3'));
  assert.ok(teamMatchCall);
  assert.ok(lineupCall);
  assert.equal(lineupCall.init.headers['accept-profile'], 'private');
});
