import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminOperationsRepository } from '../src/adminOperationsRepository.js';
import { createAdminPlayersRepository } from '../src/adminPlayersRepository.js';
import { createAdminSeasonTeamsRepository } from '../src/adminSeasonTeamsRepository.js';
import { createAvailabilityRepository } from '../src/availabilityRepository.js';
import { createChatRepository } from '../src/chatRepository.js';
import { createDateAvailabilityRepository } from '../src/dateAvailabilityRepository.js';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';
import { createFreeAgentRepository } from '../src/freeAgentRepository.js';
import { createLineupRepository } from '../src/lineupRepository.js';
import { createPlayerClaimRepository } from '../src/playerClaimRepository.js';
import { createPlayerContactRepository } from '../src/playerContactRepository.js';
import { createPlayerProfileRepository } from '../src/playerProfileRepository.js';
import { createPlayoffRepository } from '../src/playoffRepository.js';
import { createPrizeRepository } from '../src/prizeRepository.js';
import { createQaEvidenceRepository } from '../src/qaEvidenceRepository.js';
import { createSandboxFeedbackRepository } from '../src/sandboxFeedbackRepository.js';
import { createScorableMatchesRepository } from '../src/scorableMatchesRepository.js';
import { createScoringRepository } from '../src/scoringRepository.js';
import { createSeasonCloseRepository } from '../src/seasonCloseRepository.js';
import { createSeasonRegistrationRepository } from '../src/seasonRegistrationRepository.js';
import { createStandingsRepository } from '../src/standingsRepository.js';
import { createSupabaseSeasonRepository } from '../src/supabaseSeasonRepository.js';
import { createTeamMatchChoiceRepository } from '../src/teamMatchChoiceRepository.js';
import { createTeamMembershipRequestRepository } from '../src/teamMembershipRequestRepository.js';
import { createTeamRegistrationRepository } from '../src/teamRegistrationRepository.js';
import { createTeamRepository } from '../src/teamRepository.js';

const env = {
  ENVIRONMENT: 'dru',
  SUPABASE_SCHEMA: 'dru',
  SUPABASE_URL: 'https://example.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  SUPABASE_PUBLISHABLE_KEY: 'pub-key',
};

function payloadFor(url) {
  if (url.includes('get_own_team_management')) return [{ player_id: null, captain_teams: [], invitations: [] }];
  if (url.includes('get_own_team_membership_requests')) return { player_requests: [], captain_requests: [] };
  if (url.includes('get_player_claim_options')) return [{ options: { canClaim: true, reason: null, players: [] } }];
  if (url.includes('claim_unclaimed_player')) return [{ player_id: 'p1', display_name: 'Ada' }];
  if (url.includes('get_own_player_profile') || url.includes('upsert_player_profile')) return [{ display_name: 'Ada', user_id: 'u1' }];
  if (url.includes('get_own_player_phone') || url.includes('set_own_player_phone')) return [{ phone: '5550101001', has_phone: true }];
  if (url.includes('/rest/v1/rpc/')) return [{ id: 'row', player_id: 'p1', display_name: 'Ada' }];
  return [];
}

function recordingFetch(status = 200) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body || null });
    return new Response(JSON.stringify(payloadFor(String(url))), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

const actor = { actorUserId: 'u1' };
const cases = [
  ['admin operations overview', () => createAdminOperationsRepository(env, { fetch: recordingFetch() }).getOverview(actor)],
  ['admin list players', () => createAdminPlayersRepository(env, { fetch: recordingFetch() }).listPlayers(actor)],
  ['admin create player', () => createAdminPlayersRepository(env, { fetch: recordingFetch() }).createPlayer({ ...actor, displayName: 'Ada' })],
  ['admin roster teams', () => createAdminPlayersRepository(env, { fetch: recordingFetch() }).listRosterTeams(actor)],
  ['admin set role', () => createAdminPlayersRepository(env, { fetch: recordingFetch() }).setAdminRole({ ...actor, playerId: 'p1', enabled: true })],
  ['admin season teams list', () => createAdminSeasonTeamsRepository(env, { fetch: recordingFetch() }).list({ ...actor, seasonId: 's1' })],
  ['admin create prepared team', () => createAdminSeasonTeamsRepository(env, { fetch: recordingFetch() }).createPrepared({ ...actor, seasonId: 's1', teamName: 'Sharks' })],
  ['admin add team', () => createAdminSeasonTeamsRepository(env, { fetch: recordingFetch() }).add({ ...actor, seasonId: 's1', teamId: 't1' })],
  ['admin captain candidates', () => createAdminSeasonTeamsRepository(env, { fetch: recordingFetch() }).listCaptainCandidates({ ...actor, seasonId: 's1', teamId: 't1' })],
  ['admin assign captain', () => createAdminSeasonTeamsRepository(env, { fetch: recordingFetch() }).assignCaptain({ ...actor, seasonId: 's1', teamId: 't1', playerId: 'p1' })],
  ['set roster availability', () => createAvailabilityRepository(env, { fetch: recordingFetch() }).setRosterAvailability({ ...actor, roundId: 'r1', availabilityStatus: 'in' })],
  ['list team round availability', () => createAvailabilityRepository(env, { fetch: recordingFetch() }).listTeamRoundAvailability({ ...actor, teamId: 't1', roundId: 'r1' })],
  ['list chat threads', () => createChatRepository(env, { fetch: recordingFetch() }).listChatThreads(actor)],
  ['list team messages', () => createChatRepository(env, { fetch: recordingFetch() }).listTeamMessages({ ...actor, teamId: 't1', limit: 20 })],
  ['send team message', () => createChatRepository(env, { fetch: recordingFetch() }).sendTeamMessage({ ...actor, teamId: 't1', body: 'hi', clientMessageId: 'c1' })],
  ['mark team chat read', () => createChatRepository(env, { fetch: recordingFetch() }).markTeamChatRead({ ...actor, teamId: 't1', readAt: '2026-01-01' })],
  ['list direct candidates', () => createChatRepository(env, { fetch: recordingFetch() }).listDirectMessageCandidates(actor)],
  ['list direct inbox', () => createChatRepository(env, { fetch: recordingFetch() }).listDirectMessageInbox(actor)],
  ['start direct conversation', () => createChatRepository(env, { fetch: recordingFetch() }).startDirectConversation({ ...actor, seasonId: 's1', playerId: 'p2' })],
  ['own date availability', () => createDateAvailabilityRepository(env, { fetch: recordingFetch() }).getOwn({ ...actor, seasonId: 's1', availabilityDate: '2026-10-14' })],
  ['set date availability', () => createDateAvailabilityRepository(env, { fetch: recordingFetch() }).setOwn({ ...actor, seasonId: 's1', availabilityDate: '2026-10-14', availabilityStatus: 'in' })],
  ['score comparison', () => createDualScoringRepository(env, { fetch: recordingFetch() }).getPlayerMatchScoreComparison({ ...actor, playerMatchId: 'm1' })],
  ['live context', () => createDualScoringRepository(env, { fetch: recordingFetch() }).getPlayerMatchLiveContext({ ...actor, playerMatchId: 'm1' })],
  ['record a rack', () => createScoringRepository(env, { fetch: recordingFetch() }).recordPlayerMatchRack({ ...actor, playerMatchId: 'm1', winnerSide: 'a' })],
  ['undo a rack', () => createScoringRepository(env, { fetch: recordingFetch() }).undoPlayerMatchRack({ ...actor, playerMatchId: 'm1' })],
  ['finalize a match', () => createScoringRepository(env, { fetch: recordingFetch() }).finalizePlayerMatch({ ...actor, playerMatchId: 'm1' })],
  ['scorecard', () => createScoringRepository(env, { fetch: recordingFetch() }).getPlayerMatchScorecard({ ...actor, playerMatchId: 'm1' })],
  ['register free agent', () => createFreeAgentRepository(env, { fetch: recordingFetch() }).registerFreeAgent({ ...actor, seasonId: 's1' })],
  ['free agent availability', () => createFreeAgentRepository(env, { fetch: recordingFetch() }).setFreeAgentAvailability({ ...actor, roundId: 'r1', availabilityStatus: 'in' })],
  ['eligible free agents', () => createFreeAgentRepository(env, { fetch: recordingFetch() }).listEligibleFreeAgents({ ...actor, teamId: 't1', roundId: 'r1' })],
  ['submit lineup', () => createLineupRepository(env, { fetch: recordingFetch() }).submitTeamLineup({ ...actor, teamId: 't1', roundId: 'r1', slots: [{ slotNumber: 1, playerId: 'p1' }] })],
  ['list lineups', () => createLineupRepository(env, { fetch: recordingFetch() }).listVisibleTeamLineups({ ...actor, teamId: 't1', roundId: 'r1' })],
  ['claim options', () => createPlayerClaimRepository(env, { fetch: recordingFetch() }).getOptions({ ...actor, search: 'Ada' })],
  ['claim a player', () => createPlayerClaimRepository(env, { fetch: recordingFetch() }).claim({ ...actor, playerId: 'p1' })],
  ['own contact', () => createPlayerContactRepository(env, { fetch: recordingFetch() }).getOwn(actor)],
  ['set contact', () => createPlayerContactRepository(env, { fetch: recordingFetch() }).setOwn({ ...actor, phone: '5550101001' })],
  ['admin contact', () => createPlayerContactRepository(env, { fetch: recordingFetch() }).getAdminPlayer({ ...actor, playerId: 'p1' })],
  ['own profile', () => createPlayerProfileRepository(env, { fetch: recordingFetch() }).getProfileByUserId('u1')],
  ['save profile', () => createPlayerProfileRepository(env, { fetch: recordingFetch() }).saveProfile({ actorUserId: 'u1', displayName: 'Ada' })],
  ['start playoffs', () => createPlayoffRepository(env, { fetch: recordingFetch() }).startSeasonPlayoffs({ seasonId: 's1', actorUserId: 'u1' })],
  ['advance to championship', () => createPlayoffRepository(env, { fetch: recordingFetch() }).advanceSeasonToChampionship({ seasonId: 's1', actorUserId: 'u1' })],
  ['prize summary', () => createPrizeRepository(env, { fetch: recordingFetch() }).getSeasonPrizeSummary({ seasonId: 's1' })],
  ['configure prizes', () => createPrizeRepository(env, { fetch: recordingFetch() }).configureSeasonPrizes({ actorUserId: 'u1', seasonId: 's1', entryFeeCents: 2000, administrationAmountCents: 0, teamAllocationBasisPoints: 6000, individualAllocationBasisPoints: 4000, projectedFieldSize: 8, payoutTemplates: [] })],
  ['finalize payouts', () => createPrizeRepository(env, { fetch: recordingFetch() }).finalizeSeasonPrizePayouts({ actorUserId: 'u1', seasonId: 's1', finalizedPayouts: [] })],
  ['qa run by id', () => createQaEvidenceRepository({ ...env, ENVIRONMENT: 'jfl', SUPABASE_SCHEMA: 'jfl' }, { fetch: recordingFetch() }).getRunById('run-1')],
  ['qa list runs', () => createQaEvidenceRepository({ ...env, ENVIRONMENT: 'jfl', SUPABASE_SCHEMA: 'jfl' }, { fetch: recordingFetch() }).listRuns({ limit: 5 })],
  ['submit feedback', () => createSandboxFeedbackRepository(env, { fetch: recordingFetch() }).submitSandboxFeedback({ ...actor, surface: 'profile', path: '/profile', context: {}, comment: 'ok' })],
  ['list feedback', () => createSandboxFeedbackRepository(env, { fetch: recordingFetch() }).listSandboxFeedback({ ...actor, status: 'open', limit: 10 })],
  ['resolve feedback', () => createSandboxFeedbackRepository(env, { fetch: recordingFetch() }).resolveSandboxFeedback({ ...actor, feedbackId: 'f1' })],
  ['scorable matches', () => createScorableMatchesRepository(env, { fetch: recordingFetch() }).listScorableMatches(actor)],
  ['close readiness', () => createSeasonCloseRepository(env, { fetch: recordingFetch() }).getCloseReadiness({ ...actor, seasonId: 's1' })],
  ['close season', () => createSeasonCloseRepository(env, { fetch: recordingFetch() }).closeSeason({ ...actor, seasonId: 's1' })],
  ['register for season', () => createSeasonRegistrationRepository(env, { fetch: recordingFetch() }).register({ ...actor, seasonId: 's1', participationType: 'rostered' })],
  ['own season registration', () => createSeasonRegistrationRepository(env, { fetch: recordingFetch() }).getOwnRegistration({ ...actor, seasonId: 's1' })],
  ['public seasons', () => createStandingsRepository(env, { fetch: recordingFetch() }).listPublicSeasons()],
  ['public schedule', () => createStandingsRepository(env, { fetch: recordingFetch() }).listSeasonSchedule({ seasonId: 's1' })],
  ['team standings', () => createStandingsRepository(env, { fetch: recordingFetch() }).listTeamStandings({ seasonId: 's1' })],
  ['individual standings', () => createStandingsRepository(env, { fetch: recordingFetch() }).listIndividualStandings({ seasonId: 's1' })],
  ['admin seasons', () => createSupabaseSeasonRepository(env, { fetch: recordingFetch() }).listAdminSeasons(actor)],
  ['get season', () => createSupabaseSeasonRepository(env, { fetch: recordingFetch() }).getSeason('s1')],
  ['match choices', () => createTeamMatchChoiceRepository(env, { fetch: recordingFetch() }).listMyTeamMatchChoices(actor)],
  ['choose team', () => createTeamMatchChoiceRepository(env, { fetch: recordingFetch() }).chooseTeamMatchTeam({ ...actor, teamMatchId: 'm1', teamId: 't1' })],
  ['membership requests', () => createTeamMembershipRequestRepository(env, { fetch: recordingFetch() }).listOwn(actor)],
  ['own team registration', () => createTeamRegistrationRepository(env, { fetch: recordingFetch() }).getOwn({ ...actor, seasonId: 's1' })],
  ['submit team application', () => createTeamRegistrationRepository(env, { fetch: recordingFetch() }).submitApplication({ ...actor, seasonId: 's1', teamName: 'Sharks' })],
  ['admin team registration', () => createTeamRegistrationRepository(env, { fetch: recordingFetch() }).getAdmin({ ...actor, seasonId: 's1' })],
  ['own team management', () => createTeamRepository(env, { fetch: recordingFetch() }).listOwnTeamManagement(actor)],
  ['create team', () => createTeamRepository(env, { fetch: recordingFetch() }).createTeamWithCaptain({ ...actor, seasonId: 's1', teamName: 'Sharks' })],
  ['invite player', () => createTeamRepository(env, { fetch: recordingFetch() }).invitePlayerToTeam({ ...actor, teamId: 't1', playerId: 'p2' })],
  ['respond to invitation', () => createTeamRepository(env, { fetch: recordingFetch() }).respondToTeamInvitation({ ...actor, invitationId: 'i1', response: 'accepted' })],
  ['cancel invitation', () => createTeamRepository(env, { fetch: recordingFetch() }).cancelTeamInvitation({ ...actor, invitationId: 'i1' })],
  ['remove member', () => createTeamRepository(env, { fetch: recordingFetch() }).removeTeamMember({ ...actor, membershipId: 'mem1' })],
];

for (const [label, run] of cases) {
  test('repository ' + label + ' calls Supabase and returns', async () => {
    const result = await run();
    assert.notEqual(result, undefined);
  });
}

const factories = [
  ['admin operations', createAdminOperationsRepository],
  ['admin players', createAdminPlayersRepository],
  ['profile', createPlayerProfileRepository],
  ['contact', createPlayerContactRepository],
  ['claim', createPlayerClaimRepository],
  ['standings', createStandingsRepository],
  ['teams', createTeamRepository],
  ['team registration', createTeamRegistrationRepository],
  ['scoring', createScoringRepository],
  ['chat', createChatRepository],
];
for (const [label, factory] of factories) {
  test(label + ' repository requires a supabase url', () => {
    assert.throws(() => factory({ SUPABASE_SERVICE_ROLE_KEY: 'x' }, { fetch: recordingFetch() }), /SUPABASE_URL/);
  });
  test(label + ' repository requires a service role key', () => {
    assert.throws(() => factory({ SUPABASE_URL: 'https://example.supabase.co' }, { fetch: recordingFetch() }), /SUPABASE_SERVICE_ROLE_KEY/);
  });
  test(label + ' repository requires a fetch', () => {
    assert.throws(() => factory(env, { fetch: null }), /fetch/);
  });
}

test('a profile save sends the display name to the upsert rpc', async () => {
  const fetchImpl = recordingFetch();
  await createPlayerProfileRepository(env, { fetch: fetchImpl }).saveProfile({ actorUserId: 'u1', displayName: 'Ada' });
  const call = fetchImpl.calls.find((entry) => entry.url.includes('upsert_player_profile'));
  assert.ok(call);
  assert.match(call.body, /Ada/);
  assert.match(call.body, /u1/);
});

test('a team create sends the team name to the create rpc', async () => {
  const fetchImpl = recordingFetch();
  await createTeamRepository(env, { fetch: fetchImpl }).createTeamWithCaptain({ actorUserId: 'u1', seasonId: 's1', teamName: 'Sharks' });
  const call = fetchImpl.calls.find((entry) => entry.url.includes('create_team_with_captain'));
  assert.ok(call);
  assert.match(call.body, /Sharks/);
  assert.match(call.body, /s1/);
});

test('standings asks for the season', async () => {
  const fetchImpl = recordingFetch();
  await createStandingsRepository(env, { fetch: fetchImpl }).listTeamStandings({ seasonId: 'fall-2026' });
  const call = fetchImpl.calls.find((entry) => entry.url.includes('rpc/'));
  assert.ok(call);
  assert.match(call.body || call.url, /fall-2026/);
});

test('a failed supabase response is surfaced', async () => {
  await assert.rejects(
    () => createPlayerProfileRepository(env, { fetch: recordingFetch(500) }).getProfileByUserId('u1'),
    /Supabase request failed with 500/,
  );
});

test('claim options fall back when the row has none', async () => {
  const fetchImpl = async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  const options = await createPlayerClaimRepository(env, { fetch: fetchImpl }).getOptions({ actorUserId: 'u1' });
  assert.equal(options.canClaim, true);
  assert.deepEqual(options.players, []);
});
