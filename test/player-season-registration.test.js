import assert from 'node:assert/strict';
import test from 'node:test';

import { enhanceProfileSeasonRegistration } from '../src/profileSeasonRegistrationEnhancer.js';
import { routePlayerSeasonRegistration } from '../src/playerSeasonRegistrationHttp.js';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
};

function authRequest(method = 'GET', body) {
  return new Request('https://fremontderby.test/api/seasons/season-1/registration/me', {
    method,
    headers: {
      authorization: 'Bearer player-token',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('GET returns only the signed-in player registration and payment state', async () => {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith('/auth/v1/user')) {
      return jsonResponse({ id: 'actor-user', email: 'player@example.com' });
    }
    if (String(url).endsWith('/rest/v1/rpc/get_own_season_registration')) {
      return jsonResponse([{
        season_id: 'season-1',
        player_id: 'private-player-id',
        participation_type: 'free_agent',
        registration_status: 'active',
        registered_at: '2026-08-11T20:00:00Z',
        payment_status: 'unpaid',
        amount_due_cents: 5000,
        amount_paid_cents: 0,
      }]);
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  const response = await routePlayerSeasonRegistration(authRequest(), env, { fetch });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    registration: {
      participationType: 'free_agent',
      registrationStatus: 'active',
      registeredAt: '2026-08-11T20:00:00Z',
      paymentStatus: 'unpaid',
      amountDueCents: 5000,
      amountPaidCents: 0,
    },
  });
  assert.equal(calls[1].init.headers.authorization, 'Bearer service-role-test-key');
  assert.equal(calls[1].init.body, JSON.stringify({ actor_user_id: 'actor-user', target_season_id: 'season-1' }));
});

test('POST registers the actor and preserves rostered/free-agent choice without exposing private ids', async () => {
  let rpcBody;
  const fetch = async (url, init = {}) => {
    if (String(url).endsWith('/auth/v1/user')) return jsonResponse({ id: 'actor-user' });
    if (String(url).endsWith('/rest/v1/rpc/register_for_season')) {
      rpcBody = JSON.parse(init.body);
      return jsonResponse([{
        season_id: 'season-1',
        player_id: 'private-player-id',
        participation_type: 'rostered',
        registration_status: 'active',
        registered_at: '2026-08-11T20:00:00Z',
        payment_status: 'paid',
        amount_due_cents: 5000,
        amount_paid_cents: 5000,
      }]);
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  const response = await routePlayerSeasonRegistration(
    authRequest('POST', { participationType: 'rostered' }),
    env,
    { fetch },
  );
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.registration.registrationStatus, 'active');
  assert.equal(body.registration.paymentStatus, 'paid');
  assert.equal('playerId' in body.registration, false);
  assert.deepEqual(rpcBody, {
    actor_user_id: 'actor-user',
    target_season_id: 'season-1',
    registration_participation_type: 'rostered',
  });
});

test('registration endpoint rejects unsigned requests before touching privileged persistence', async () => {
  let fetchCalled = false;
  const request = new Request('https://fremontderby.test/api/seasons/season-1/registration/me');
  const response = await routePlayerSeasonRegistration(request, env, {
    fetch: async () => {
      fetchCalled = true;
      return jsonResponse({});
    },
  });
  assert.equal(response.status, 401);
  assert.equal(fetchCalled, false);
});

test('Profile enhancement keeps registration and payment state together with phone-safe actions', async () => {
  const input = new Response(
    '<!doctype html><html><head></head><body><section class="stack" data-authenticated-content hidden></section></body></html>',
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
  const response = await enhanceProfileSeasonRegistration(input);
  const html = await response.text();

  assert.match(html, /Current season/);
  assert.match(html, /Join this season/);
  assert.match(html, /Not registered/);
  assert.match(html, /Payment due/);
  assert.match(html, /Registration closed/);
  assert.match(html, /Try again/);
  assert.match(html, /min-height:48px/);
  assert.match(html, /data-payment-state/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /\/api\/seasons\//);
  assert.match(html, /\/registration\/me/);
  assert.match(html, /participationType:rostered\?'rostered':'free_agent'/);
  assert.doesNotMatch(html, /player_id|payment notes|reviewed_by|actor_user_id/);
});
