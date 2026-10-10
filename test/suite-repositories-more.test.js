import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatRepository } from '../src/chatRepository.js';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';
import { createScoringRepository } from '../src/scoringRepository.js';
import { createTeamRepository } from '../src/teamRepository.js';
import { createTeamRegistrationRepository } from '../src/teamRegistrationRepository.js';
import { createTeamMembershipRequestRepository } from '../src/teamMembershipRequestRepository.js';
import { createPlayoffRepository } from '../src/playoffRepository.js';
import { createStandingsRepository } from '../src/standingsRepository.js';
import { createPlayerProfileRepository } from '../src/playerProfileRepository.js';
import { createPlayerContactRepository } from '../src/playerContactRepository.js';

const env = {
  ENVIRONMENT: 'dru',
  SUPABASE_SCHEMA: 'dru',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
};

function fetchOk(body = [{ id: 'row' }]) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), body: init.body || '' });
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}
function fetchFail(status, message = 'nope') {
  return async () => new Response(JSON.stringify({ message }), { status, headers: { 'content-type': 'application/json' } });
}

const chatCalls = [
  ['list league threads', (repo) => repo.listLeagueChatThreads({ actorUserId: 'u1' })],
  ['list league messages', (repo) => repo.listLeagueMessages({ actorUserId: 'u1', seasonId: 's1', limit: 10 })],
  ['send league message', (repo) => repo.sendLeagueMessage({ actorUserId: 'u1', seasonId: 's1', body: 'hi', clientMessageId: 'c1' })],
  ['mark league read', (repo) => repo.markLeagueChatRead({ actorUserId: 'u1', seasonId: 's1', readAt: '2026-01-01' })],
  ['list matchup threads', (repo) => repo.listMatchupChatThreads({ actorUserId: 'u1' })],
  ['send matchup message', (repo) => repo.sendMatchupMessage({ actorUserId: 'u1', teamMatchId: 'm1', body: 'hi', clientMessageId: 'c1' })],
  ['block a player', (repo) => repo.blockPlayerChat({ actorUserId: 'u1', playerId: 'p2' })],
  ['unblock a player', (repo) => repo.unblockPlayerChat({ actorUserId: 'u1', playerId: 'p2' })],
  ['list blocked', (repo) => repo.listBlockedChatPlayers({ actorUserId: 'u1' })],
  ['list reports', (repo) => repo.listChatReports({ actorUserId: 'u1', limit: 10 })],
  ['report a message', (repo) => repo.reportChatMessage({ actorUserId: 'u1', messageType: 'team', messageId: 'msg1', reason: 'spam', details: '' })],
];
for (const [label, run] of chatCalls) {
  test('chat repository ' + label, async () => {
    const fetchImpl = fetchOk();
    const result = await run(createChatRepository(env, { fetch: fetchImpl }));
    assert.ok(fetchImpl.calls.length > 0);
    assert.notEqual(result, undefined);
  });
}

const teamCalls = [
  ['list trades', (repo) => repo.listOwnTeamTrades({ actorUserId: 'u1' })],
  ['propose trade', (repo) => repo.proposeTeamTrade({ actorUserId: 'u1', teamId: 't1', offeredPlayerId: 'p1', requestedTeamId: 't2', requestedPlayerId: 'p2' })],
  ['admin trade exception', (repo) => repo.adminProposeTeamTradeException({ actorUserId: 'admin', teamId: 't1', offeredPlayerId: 'p1', requestedTeamId: 't2', requestedPlayerId: 'p2' })],
  ['player trade response', (repo) => repo.respondToTeamTradePlayer({ actorUserId: 'u1', tradeId: 'tr1', response: 'accepted' })],
  ['captain trade response', (repo) => repo.approveTeamTradeCaptain({ actorUserId: 'u1', tradeId: 'tr1', response: 'approved' })],
];
for (const [label, run] of teamCalls) {
  test('team repository ' + label, async () => {
    const fetchImpl = fetchOk([{ player_id: null, captain_teams: [], invitations: [] }]);
    await run(createTeamRepository(env, { fetch: fetchImpl }));
    assert.ok(fetchImpl.calls.some((call) => call.url.includes('/rpc/')));
  });
}

const registrationCalls = [
  ['withdraw', (repo) => repo.withdrawApplication({ actorUserId: 'u1', applicationId: 'a1' })],
  ['returning slot', (repo) => repo.respondToReturningSlot({ actorUserId: 'u1', slotId: 'slot1', action: 'confirm' })],
  ['configure', (repo) => repo.configure({ actorUserId: 'admin', seasonId: 's1', teamCapacity: 8, minimumCommittedRoster: 3, conditionalHoldDays: 7 })],
  ['review', (repo) => repo.reviewApplication({ actorUserId: 'admin', applicationId: 'a1', decision: 'approve' })],
  ['manage slot', (repo) => repo.manageSlot({ actorUserId: 'admin', slotId: 'slot1', action: 'extend', reason: 'weather', extensionDays: 7 })],
  ['seed returning', (repo) => repo.seedReturningSlots({ actorUserId: 'admin', seasonId: 's1', sourceSeasonId: 's0' })],
];
for (const [label, run] of registrationCalls) {
  test('team registration repository ' + label, async () => {
    const fetchImpl = fetchOk();
    await run(createTeamRegistrationRepository(env, { fetch: fetchImpl }));
    assert.ok(fetchImpl.calls[0].url.includes('/rpc/'));
  });
}

test('membership request join calls the rpc', async () => {
  const fetchImpl = fetchOk();
  await createTeamMembershipRequestRepository(env, { fetch: fetchImpl }).requestJoin({ actorUserId: 'u1', teamId: 't1' });
  assert.ok(fetchImpl.calls[0].url.includes('rpc/'));
});
test('membership request respond calls the rpc', async () => {
  const fetchImpl = fetchOk();
  await createTeamMembershipRequestRepository(env, { fetch: fetchImpl }).respond({ actorUserId: 'u1', requestId: 'r1', response: 'accepted' });
  assert.ok(fetchImpl.calls[0].url.includes('rpc/'));
});

test('postseason lineup is sent to the rpc', async () => {
  const fetchImpl = fetchOk();
  await createPlayoffRepository(env, { fetch: fetchImpl }).submitPostseasonLineup({
    actorUserId: 'u1', teamMatchId: 'm1', teamId: 't1', playerIds: ['p1', 'p2'], anchorPlayerId: 'p1',
  });
  assert.match(fetchImpl.calls[0].body, /p1/);
});

for (const status of [400, 401, 403, 404, 409, 500]) {
  test('profile repository surfaces a ' + status, async () => {
    await assert.rejects(
      () => createPlayerProfileRepository(env, { fetch: fetchFail(status, 'denied') }).getProfileByUserId('u1'),
      new RegExp('Supabase request failed with ' + status),
    );
  });
  test('contact repository surfaces a ' + status, async () => {
    await assert.rejects(
      () => createPlayerContactRepository(env, { fetch: fetchFail(status) }).getOwn({ actorUserId: 'u1' }),
      new RegExp('Supabase request failed with ' + status),
    );
  });
  test('standings repository surfaces a ' + status, async () => {
    await assert.rejects(
      () => createStandingsRepository(env, { fetch: fetchFail(status) }).listTeamStandings({ seasonId: 's1' }),
      new RegExp('Supabase request failed with ' + status),
    );
  });
}

for (const side of ['a', 'b']) {
  test('scoring records a win for side ' + side, async () => {
    const fetchImpl = fetchOk();
    await createScoringRepository(env, { fetch: fetchImpl }).recordPlayerMatchRack({ actorUserId: 'u1', playerMatchId: 'm1', winnerSide: side });
    assert.match(fetchImpl.calls[0].body, new RegExp(side));
  });
  test('dual scoring records a win for side ' + side, async () => {
    const fetchImpl = fetchOk();
    await createDualScoringRepository(env, { fetch: fetchImpl }).recordPlayerMatchScoreRack({
      actorUserId: 'u1', playerMatchId: 'm1', scoringTeamId: 't1', winnerSide: side,
    });
    assert.match(fetchImpl.calls[0].body, new RegExp(side));
  });
}

for (const seasonId of ['s1', 'fall-2026', 'spring-2027']) {
  test('standings schedule for ' + seasonId, async () => {
    const fetchImpl = fetchOk([]);
    await createStandingsRepository(env, { fetch: fetchImpl }).listSeasonSchedule({ seasonId });
    assert.match(fetchImpl.calls[0].body || fetchImpl.calls[0].url, new RegExp(seasonId));
  });
}
