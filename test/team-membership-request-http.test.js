import test from 'node:test';
import assert from 'node:assert/strict';

import { createTeamMembershipRequestHttpHandlers } from '../src/teamMembershipRequestHttp.js';

function handlersFor(repository, actorId = 'user-1') {
  return createTeamMembershipRequestHttpHandlers({
    authenticate: async () => ({ id: actorId }),
    createRepository: () => repository,
  });
}

async function bodyOf(response) {
  return response.json();
}

test('signed-in player can request membership in a team', async () => {
  const calls = [];
  const handlers = handlersFor({
    async requestJoin(input) {
      calls.push(input);
      return { id: 'req-1', team_id: 'team-1', status: 'pending' };
    },
  });

  const response = await handlers.requestJoin(
    new Request('https://example.test/api/teams/team-1/membership-request', { method: 'POST' }),
    {},
    'team-1',
  );

  assert.equal(response.status, 201);
  assert.deepEqual(calls, [{ actorUserId: 'user-1', teamId: 'team-1' }]);
  assert.equal((await bodyOf(response)).membershipRequest.status, 'pending');
});

test('captain can approve or decline a membership request', async () => {
  const calls = [];
  const handlers = handlersFor({
    async respond(input) {
      calls.push(input);
      return { id: input.requestId, status: input.response };
    },
  });

  const request = new Request('https://example.test/api/team-membership-requests/req-1/respond', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ response: 'approved' }),
  });
  const response = await handlers.respond(request, {}, 'req-1');

  assert.equal(response.status, 200);
  assert.deepEqual(calls, [{ actorUserId: 'user-1', requestId: 'req-1', response: 'approved' }]);
});

test('invalid response decision is rejected before repository call', async () => {
  let called = false;
  const handlers = handlersFor({
    async respond() {
      called = true;
    },
  });

  const response = await handlers.respond(new Request('https://example.test/respond', {
    method: 'POST',
    body: JSON.stringify({ response: 'maybe' }),
  }), {}, 'req-1');

  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test('requesting player can cancel their pending request', async () => {
  const calls = [];
  const handlers = handlersFor({
    async cancel(input) {
      calls.push(input);
      return { id: input.requestId, status: 'cancelled' };
    },
  });

  const response = await handlers.cancel(
    new Request('https://example.test/cancel', { method: 'POST' }),
    {},
    'req-2',
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, [{ actorUserId: 'user-1', requestId: 'req-2' }]);
});

test('player and captain request lists are returned through one endpoint', async () => {
  const handlers = handlersFor({
    async listOwn() {
      return {
        player_requests: [{ requestId: 'mine', status: 'pending' }],
        captain_requests: [{ requestId: 'incoming', status: 'pending' }],
      };
    },
  });

  const response = await handlers.list(new Request('https://example.test/list'), {});
  const payload = await bodyOf(response);
  assert.equal(response.status, 200);
  assert.equal(payload.requests.player_requests.length, 1);
  assert.equal(payload.requests.captain_requests.length, 1);
});

test('conflicting membership state maps to 409', async () => {
  const handlers = handlersFor({
    async requestJoin() {
      throw new Error('Supabase request failed with 400: Player already has an active team membership');
    },
  });

  const response = await handlers.requestJoin(
    new Request('https://example.test/request', { method: 'POST' }),
    {},
    'team-1',
  );
  assert.equal(response.status, 409);
});
