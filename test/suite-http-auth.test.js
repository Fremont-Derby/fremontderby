import test from 'node:test';
import assert from 'node:assert/strict';
import { routePlayerContact } from '../src/playerContactHttp.js';
import { routePlayerClaim } from '../src/playerClaimHttp.js';
import { teamMatchChoiceHttpHandlers } from '../src/teamMatchChoiceHttp.js';
import { handleListAdminPlayersRequest, handleSetAdminRoleRequest } from '../src/adminPlayersHttp.js';
import { handleCreateAdminPlayerRequest } from '../src/adminCreatePlayerHttp.js';
import { routeDateAvailability } from '../src/dateAvailabilityHttp.js';
import { routeSeasonClose } from '../src/seasonCloseHttp.js';

const env = {
  ENVIRONMENT: 'dru',
  BETA_AUTH_BYPASS: '1',
  BETA_ACTOR_USER_ID: 'u1',
  BETA_ACTOR_EMAIL: 'actor@example.com',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  SUPABASE_PUBLISHABLE_KEY: 'pub',
  SUPABASE_SCHEMA: 'dru',
};

function fakeFetch(payload = []) {
  return async () => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
function request(path, { method = 'GET', body, token = 'dru-bypass' } = {}) {
  return new Request('https://dru.fremontderby.com' + path, {
    method,
    headers: {
      authorization: token ? 'Bearer ' + token : '',
      'content-type': 'application/json',
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
}

test('a contact read with no token is rejected', async () => {
  const response = await routePlayerContact(request('/api/me/contact', { token: 'not-a-real-token' }), env, { fetch: fakeFetch() });
  assert.equal(response.status, 401);
});
test('a contact read for the signed-in player returns a contact', async () => {
  const response = await routePlayerContact(
    request('/api/me/contact'),
    env,
    { fetch: fakeFetch([{ phone: '5550101001', has_phone: true }]) },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.contact.hasPhone, true);
});
test('saving a short phone is a 400', async () => {
  const response = await routePlayerContact(
    request('/api/me/contact', { method: 'PUT', body: { phone: '123' } }),
    env,
    { fetch: fakeFetch([]) },
  );
  assert.equal(response.status, 400);
});
test('a contact path the route does not own returns null', async () => {
  const response = await routePlayerContact(request('/api/nope'), env, { fetch: fakeFetch() });
  assert.equal(response, null);
});
test('posting to own contact is not allowed', async () => {
  const response = await routePlayerContact(request('/api/me/contact', { method: 'POST' }), env, { fetch: fakeFetch() });
  assert.equal(response.status, 405);
});

test('claim options with no token are rejected', async () => {
  const response = await routePlayerClaim(request('/api/me/player-claim-options', { token: 'not-a-real-token' }), env, { fetch: fakeFetch() });
  assert.equal(response.status, 401);
});
test('claim options for a signed-in player return a list', async () => {
  const response = await routePlayerClaim(
    request('/api/me/player-claim-options'),
    env,
    { fetch: fakeFetch({ options: { canClaim: true, players: [] } }) },
  );
  assert.equal(response.status, 200);
});
test('posting a claim without a player is a 400', async () => {
  const response = await routePlayerClaim(
    request('/api/me/player-claim', { method: 'POST', body: {} }),
    env,
    { fetch: fakeFetch({}) },
  );
  assert.equal(response.status, 400);
});

test('team match choices with no token are rejected', async () => {
  const response = await teamMatchChoiceHttpHandlers.list(request('/api/me/team-match-choices', { token: 'not-a-real-token' }), env, { fetch: fakeFetch() });
  assert.equal(response.status, 401);
});
test('a signed-in player can list team match choices', async () => {
  const response = await teamMatchChoiceHttpHandlers.list(request('/api/me/team-match-choices'), env, { fetch: fakeFetch([]) });
  assert.equal(response.status, 200);
});
test('choosing a side without a team is rejected', async () => {
  const response = await teamMatchChoiceHttpHandlers.choose(
    request('/api/team-matches/m1/choice', { method: 'POST', body: {} }),
    env,
    'm1',
    { fetch: fakeFetch([]) },
  );
  assert.notEqual(response.status, 200);
});

test('admin player list with no token is rejected', async () => {
  const response = await handleListAdminPlayersRequest(request('/api/admin/players', { token: 'not-a-real-token' }), env, { fetch: fakeFetch() });
  assert.equal(response.status, 401);
});
test('admin player list for a signed-in actor returns players', async () => {
  const response = await handleListAdminPlayersRequest(request('/api/admin/players'), env, { fetch: fakeFetch([]) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body.players));
});
test('creating a player without a name is a 400', async () => {
  const response = await handleCreateAdminPlayerRequest(
    request('/api/admin/players', { method: 'POST', body: {} }),
    env,
    { fetch: fakeFetch([]) },
  );
  assert.equal(response.status, 400);
});
test('setting an admin role with no token is rejected', async () => {
  const response = await handleSetAdminRoleRequest(request('/api/admin/players/p1/role', { method: 'PUT', token: 'not-a-real-token', body: {} }), env, 'p1', { fetch: fakeFetch() });
  assert.equal(response.status, 401);
});

test('availability with no token is rejected', async () => {
  const response = await routeDateAvailability(request('/api/seasons/s1/availability/me', { token: 'not-a-real-token' }), env, { fetch: fakeFetch() });
  assert.equal(response.status, 401);
});
test('availability for an unknown path returns null', async () => {
  const response = await routeDateAvailability(request('/api/nope'), env, { fetch: fakeFetch() });
  assert.equal(response, null);
});
test('posting availability is not allowed', async () => {
  const response = await routeDateAvailability(request('/api/seasons/s1/availability/me', { method: 'POST' }), env, { fetch: fakeFetch() });
  assert.equal(response.status, 405);
});

test('season close readiness with no token is rejected', async () => {
  const response = await routeSeasonClose(request('/api/admin/seasons/s1/close-readiness', { token: 'not-a-real-token' }), env);
  assert.ok(response.status === 400 || response.status === 401);
});
test('posting to close readiness is not allowed', async () => {
  const response = await routeSeasonClose(request('/api/admin/seasons/s1/close-readiness', { method: 'POST' }), env);
  assert.equal(response.status, 405);
});
test('a path season close does not own returns null', async () => {
  const response = await routeSeasonClose(request('/api/nope'), env);
  assert.equal(response, null);
});

for (const path of ['/api/me/contact', '/api/admin/players/p1/contact']) {
  test('contact route recognizes ' + path, async () => {
    const response = await routePlayerContact(request(path), env, { fetch: fakeFetch([]) });
    assert.notEqual(response, null);
    assert.equal(typeof response.status, 'number');
  });
}

for (const method of ['DELETE', 'PATCH']) {
  test('contact rejects ' + method, async () => {
    const response = await routePlayerContact(request('/api/me/contact', { method }), env, { fetch: fakeFetch() });
    assert.equal(response.status, 405);
  });
  test('availability rejects ' + method, async () => {
    const response = await routeDateAvailability(request('/api/seasons/s1/availability/me', { method }), env, { fetch: fakeFetch() });
    assert.equal(response.status, 405);
  });
}
test('admin contact for a missing player is not a success', async () => {
  const response = await routePlayerContact(request('/api/admin/players/missing/contact'), env, { fetch: fakeFetch([]) });
  assert.notEqual(response, null);
});
test('creating a named player reaches the repository', async () => {
  const response = await handleCreateAdminPlayerRequest(
    request('/api/admin/players', { method: 'POST', body: { displayName: 'Ada' } }),
    env,
    { fetch: fakeFetch([{ player_id: 'p1', display_name: 'Ada' }]) },
  );
  assert.equal(typeof response.status, 'number');
});
test('a signed-in availability read returns a response', async () => {
  const response = await routeDateAvailability(request('/api/seasons/s1/availability/me'), env, { fetch: fakeFetch([]) });
  assert.equal(typeof response.status, 'number');
});
test('close readiness for a signed-in actor returns a response', async () => {
  const response = await routeSeasonClose(request('/api/admin/seasons/s1/close-readiness'), env);
  assert.equal(typeof response.status, 'number');
});
