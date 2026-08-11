import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminOperationsOverview, handleAdminOperationsRequest } from '../src/adminOperationsHttp.js';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';
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

test('operations overview prioritizes actionable league risks', () => {
  const overview = buildAdminOperationsOverview({
    generatedAt: '2026-08-11T00:00:00Z',
    season: { id: 'season-1', name: 'Season 1', status: 'registration' },
    latestRatingUpdate: null,
    metrics: metrics({
      profiles: 8, seasonPlayers: 8, teams: 0, paidPlayers: 6,
      ratings: 5, openReports: 1, liveMatches: 0,
      rounds: 0, teamMatches: 0, lineups: 0, playerMatches: 0,
      finalizedMatches: 0, forfeits: 0, teamMessages: 4,
      directMessages: 3, leagueMessages: 2, matchupMessages: 1,
    }),
  }, readiness);

  assert.equal(overview.overall, 'critical');
  assert.equal(overview.counts.messages, 10);
  assert.deepEqual(
    overview.actions.map((item) => item.code),
    ['ratings_missing', 'teams_missing', 'payments_incomplete', 'reports_open'],
  );
});

test('operations overview flags a current round with no availability responses', () => {
  const overview = buildAdminOperationsOverview({
    generatedAt: '2026-08-11T00:00:00Z',
    season: { id: 'season-1', name: 'Season 1', status: 'active' },
    currentRound: {
      id: 'round-2', round_number: 2, stage: 'regular', status: 'scheduled',
    },
    latestRatingUpdate: '2026-08-11T00:00:00Z',
    metrics: metrics({
      profiles: 24, seasonPlayers: 24, teams: 8, paidPlayers: 24,
      ratings: 24, openReports: 0, liveMatches: 0,
      rounds: 7, teamMatches: 28, lineups: 8, playerMatches: 12,
      finalizedMatches: 12, forfeits: 0, teamMessages: 4,
      directMessages: 3, leagueMessages: 2, matchupMessages: 1,
      rosterAvailabilityResponses: 0, availableRosterResponses: 0,
      unsureRosterResponses: 0, unavailableRosterResponses: 0,
      availableFreeAgents: 0,
    }),
  }, readiness);

  assert.equal(overview.currentRound.id, 'round-2');
  assert.equal(overview.counts.rosterAvailabilityResponses, 0);
  assert.deepEqual(overview.actions.map((item) => item.code), ['availability_missing']);
  assert.equal(overview.actions[0].href, '/availability');
  assert.match(overview.actions[0].detail, /Round 2/);
});

test('operations endpoint authenticates and enforces the existing league-admin RPC', async () => {
  const env = {
    ENVIRONMENT: 'production',
    SUPABASE_URL: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
  };
  const fetch = async (url) => {
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: 'admin-1' });
    if (url.includes('/rpc/list_chat_message_reports')) return Response.json([]);
    if (url.includes('/seasons?')) return Response.json([]);
    return new Response('[]', { status: 200, headers: { 'content-range': '*/0' } });
  };
  const request = new Request('https://fremontderby.com/api/admin/operations', {
    headers: { authorization: 'Bearer token' },
  });
  const response = await handleAdminOperationsRequest(request, env, { fetch });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.overview.environment.supabase.projectRef, 'cpiucsxlkicmlbvdvhww');
  assert.equal(body.overview.actions[0].code, 'season_missing');
});

test('operations endpoint maps non-admin access to forbidden', async () => {
  const env = {
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
  };
  const fetch = async (url) => {
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: 'player-1' });
    return Response.json({ message: 'League admin access is required' }, { status: 400 });
  };
  const request = new Request('https://fremontderby.com/api/admin/operations', {
    headers: { authorization: 'Bearer token' },
  });
  const response = await handleAdminOperationsRequest(request, env, { fetch });
  assert.equal(response.status, 403);
});

test('operations repository keeps private metrics behind service-role profile headers', async () => {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes('/rpc/list_chat_message_reports')) return Response.json([]);
    if (url.includes('/seasons?')) {
      return Response.json([{ id: 'season-1', name: 'Season 1', status: 'registration' }]);
    }
    return new Response('[]', { status: 200, headers: { 'content-range': '*/0' } });
  };
  const repository = createAdminOperationsRepository({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
  }, { fetch });
  await repository.getOverview({ actorUserId: 'admin-1' });

  const privateCalls = calls.filter(({ url }) =>
    url.includes('/team_lineups?') || url.includes('/payment_status?'));
  assert.equal(privateCalls.length, 2);
  assert.equal(privateCalls.every(({ init }) => init.headers['accept-profile'] === 'private'), true);
  assert.equal(calls.every(({ init }) => init.headers?.authorization !== 'Bearer player-token'), true);
});

test('operations page uses the Google session and fits phone width without a wide table', () => {
  const html = renderAdminOperationsPage({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  });
  assert.match(html, /League operations · Fremont Derby/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/admin\/operations/);
  assert.match(html, /Needs attention/);
  assert.match(html, /@media\(max-width:760px\)/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /Open Profile/);
  assert.match(html, /severityLabel\(severity\)/);
  assert.match(html, /Critical.*Warning.*Ready/);
  assert.match(html, /link\.textContent='Open: '\+item\.title/);
  assert.match(html, /:focus-visible/);
  assert.doesNotMatch(html, /overflow-x:auto|min-width:6\d\dpx/);
  assert.doesNotMatch(html, /Access token/i);
  assert.doesNotMatch(html, /service-secret/i);
});
