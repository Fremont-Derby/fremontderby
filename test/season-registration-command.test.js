import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getOwnSeasonRegistrationCommand,
  registerForSeasonCommand,
} from '../src/seasonRegistrationCommands.js';

function repository() {
  const calls = [];
  return {
    calls,
    async register(payload) {
      calls.push(['register', payload]);
      return { season_id: payload.seasonId, player_id: 'player-1', payment_status: 'unpaid' };
    },
    async getOwnRegistration(payload) {
      calls.push(['getOwnRegistration', payload]);
      return { season_id: payload.seasonId, player_id: 'player-1', payment_status: 'unpaid' };
    },
  };
}

test('register command defaults to free-agent participation', async () => {
  const repo = repository();
  const result = await registerForSeasonCommand(
    { actorUserId: 'user-1', seasonId: 'season-1' },
    repo,
  );
  assert.equal(result.payment_status, 'unpaid');
  assert.deepEqual(repo.calls, [[
    'register',
    { actorUserId: 'user-1', seasonId: 'season-1', participationType: 'free_agent' },
  ]]);
});

test('register command rejects unsupported participation before writing', async () => {
  const repo = repository();
  await assert.rejects(
    () => registerForSeasonCommand(
      { actorUserId: 'user-1', seasonId: 'season-1', participationType: 'guest' },
      repo,
    ),
    /rostered or free_agent/,
  );
  assert.deepEqual(repo.calls, []);
});

test('own registration command is actor and season scoped', async () => {
  const repo = repository();
  await getOwnSeasonRegistrationCommand(
    { actorUserId: 'user-1', seasonId: 'season-1' },
    repo,
  );
  assert.deepEqual(repo.calls, [[
    'getOwnRegistration',
    { actorUserId: 'user-1', seasonId: 'season-1' },
  ]]);
});
