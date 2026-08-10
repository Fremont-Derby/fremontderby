import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayoffHttpHandlers } from '../src/playoffHttp.js';

function request() {
  return new Request('https://fremontderby.com/api/admin/seasons/season-1/start-playoffs', {
    method: 'POST',
    headers: { authorization: 'Bearer test-token' },
  });
}

test('playoff start HTTP handler authenticates actor and persists semifinal seed', async () => {
  const calls = [];
  const handlers = createPlayoffHttpHandlers({
    authenticate: async () => ({ id: 'admin-1' }),
    createRepository: () => ({
      async startSeasonPlayoffs(input) {
        calls.push(input);
        return { season_id: 'season-1', playoff_round: 8, created_matchups: 2 };
      },
    }),
  });

  const response = await handlers.start(request(), {}, 'season-1');

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {
    playoffs: { season_id: 'season-1', playoff_round: 8, created_matchups: 2 },
  });
  assert.deepEqual(calls, [{ seasonId: 'season-1', actorUserId: 'admin-1' }]);
});

test('playoff start HTTP handler maps admin rejection to 403', async () => {
  const handlers = createPlayoffHttpHandlers({
    authenticate: async () => ({ id: 'player-1' }),
    createRepository: () => ({
      async startSeasonPlayoffs() {
        throw new Error('Actor is not a league admin');
      },
    }),
  });

  const response = await handlers.start(request(), {}, 'season-1');
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /not a league admin/);
});

test('playoff start HTTP handler maps incomplete regular season to 409', async () => {
  const handlers = createPlayoffHttpHandlers({
    authenticate: async () => ({ id: 'admin-1' }),
    createRepository: () => ({
      async startSeasonPlayoffs() {
        throw new Error('regular season must be complete before playoffs');
      },
    }),
  });

  const response = await handlers.start(request(), {}, 'season-1');
  assert.equal(response.status, 409);
});
