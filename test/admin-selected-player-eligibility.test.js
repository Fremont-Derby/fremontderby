import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminOperationsOverview } from '../src/adminOperationsHttp.js';
import { createAdminOperationsRepository } from '../src/adminOperationsRepository.js';

const readiness = {
  ok: true,
  environment: 'production',
  supabase: { projectRef: 'cpiucsxlkicmlbvdvhww' },
};

function metricValues(values) {
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [
    name, { value, available: true },
  ]));
}

test('operations makes a selected player who lost payment eligibility critical', () => {
  const overview = buildAdminOperationsOverview({
    generatedAt: '2026-08-11T21:30:00Z',
    season: { id: 'season-1', name: 'Season 1', status: 'active' },
    currentRound: { id: 'round-2', round_number: 2, stage: 'regular', status: 'scheduled' },
    latestRatingUpdate: '2026-08-11T21:00:00Z',
    metrics: metricValues({
      profiles: 24, seasonPlayers: 24, teams: 8, paidPlayers: 24, ratings: 24,
      rounds: 7, teamMatches: 28, lineups: 8, currentRoundTeamMatches: 4,
      currentRoundLineups: 8, selectedIneligiblePlayers: 1, playerMatches: 12,
      liveMatches: 0, finalizedMatches: 0, scoreMismatches: 0, forfeits: 0,
      rosterAvailabilityResponses: 12, availableRosterResponses: 9,
      unsureRosterResponses: 2, unavailableRosterResponses: 1, availableFreeAgents: 3,
      openReports: 0, teamMessages: 0, directMessages: 0, leagueMessages: 0,
      matchupMessages: 0,
    }),
  }, readiness);

  assert.equal(overview.overall, 'critical');
  assert.equal(overview.counts.selectedIneligiblePlayers, 1);
  assert.equal(overview.actions[0].code, 'selected_player_ineligible');
  assert.equal(overview.actions[0].href, '/teams');
  assert.match(overview.actions[0].detail, /paid or waived/);
});

test('operations repository compares selected players with paid or waived status privately', async () => {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes('/rpc/list_chat_message_reports')) return Response.json([]);
    if (url.includes('/seasons?')) {
      return Response.json([{ id: 'season-1', name: 'Season 1', status: 'active' }]);
    }
    if (url.includes('/rounds?') && url.includes('status=in.')) {
      return Response.json([{
        id: 'round-2', round_number: 2, stage: 'regular', status: 'scheduled',
      }]);
    }
    if (url.includes('/team_lineup_slots?')) {
      return Response.json([
        { player_id: 'player-paid' },
        { player_id: 'player-waived' },
        { player_id: 'player-unpaid' },
      ]);
    }
    if (url.includes('/payment_status?') && url.includes('select=player_id,status')) {
      return Response.json([
        { player_id: 'player-paid', status: 'paid' },
        { player_id: 'player-waived', status: 'waived' },
      ]);
    }
    return new Response('[]', { status: 200, headers: { 'content-range': '*/0' } });
  };

  const repository = createAdminOperationsRepository({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
  }, { fetch });
  const overview = await repository.getOverview({ actorUserId: 'admin-1' });

  assert.equal(overview.metrics.selectedIneligiblePlayers.available, true);
  assert.equal(overview.metrics.selectedIneligiblePlayers.value, 1);
  assert.equal('rows' in overview.metrics.selectedIneligiblePlayers, false);

  const selectedCall = calls.find(({ url }) => url.includes('/team_lineup_slots?'));
  const paymentCall = calls.find(({ url }) =>
    url.includes('/payment_status?') && url.includes('select=player_id,status'));
  assert.equal(selectedCall.init.headers['accept-profile'], 'private');
  assert.equal(paymentCall.init.headers['accept-profile'], 'private');
  assert.match(paymentCall.url, /status=in\.\(paid,waived\)/);
});
