import assert from 'node:assert/strict';
import test from 'node:test';

import { createAdminSeasonTeamsHttpHandlers } from '../src/adminSeasonTeamsHttp.js';

function request(path, method = 'GET') {
  return new Request(`https://example.test${path}`, { method });
}

test('season team HTTP handlers use authenticated actor and never trust actor id from the browser', async () => {
  const calls = [];
  const handlers = createAdminSeasonTeamsHttpHandlers({
    authenticate: async () => ({ id: 'signed-in-admin' }),
    createRepository: () => ({
      list(input) { calls.push(['list', input]); return { registration: {}, teams: [] }; },
      add(input) { calls.push(['add', input]); return { team_id: 'new-team' }; },
    }),
  });

  const listResponse = await handlers.list(
    request('/api/admin/seasons/season-1/team-candidates'),
    {},
    'season-1',
  );
  assert.equal(listResponse.status, 200);

  const addResponse = await handlers.add(
    request('/api/admin/seasons/season-1/teams/team-old/add', 'POST'),
    {},
    'season-1',
    'team-old',
  );
  assert.equal(addResponse.status, 201);
  assert.deepEqual(calls, [
    ['list', { actorUserId: 'signed-in-admin', seasonId: 'season-1' }],
    ['add', { actorUserId: 'signed-in-admin', seasonId: 'season-1', teamId: 'team-old' }],
  ]);
});

test('season team HTTP handler maps league-admin denial to 403', async () => {
  const handlers = createAdminSeasonTeamsHttpHandlers({
    authenticate: async () => ({ id: 'normal-user' }),
    createRepository: () => ({
      list() { throw new Error('Actor is not a league admin'); },
    }),
  });
  const response = await handlers.list(
    request('/api/admin/seasons/season-1/team-candidates'),
    {},
    'season-1',
  );
  assert.equal(response.status, 403);
});
