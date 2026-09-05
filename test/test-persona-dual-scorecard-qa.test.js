import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { injectTestPersonaControls } from '../src/testPersonaEnhancer.js';
import { routeTestPersona } from '../src/testPersonaHttp.js';
import { JFL_SIMULATED_OIDC_ACCESS_TOKEN } from '../src/supabaseAuth.js';

const operatorId = 'b22805b6-92ba-44bd-a92e-0c82f0be6613';

function jflEnv() {
  return {
    ENVIRONMENT: 'jfl',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: operatorId,
    BETA_ACTOR_EMAIL: 'jfl-actor@fremontderby.com',
    TEST_PERSONA_OPERATOR_USER_IDS: operatorId,
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-test-key',
  };
}

test('JFL operator can reset the dual-team scorecard fixture through the service-role RPC', async () => {
  const calls = [];
  const response = await routeTestPersona(
    new Request('https://jfl.fremontderby.com/api/test-persona/dual-scorecard-reset', {
      method: 'POST',
      headers: { authorization: `Bearer ${JFL_SIMULATED_OIDC_ACCESS_TOKEN}` },
    }),
    jflEnv(),
    {
      fetch: async (url, init) => {
        calls.push({ url, init });
        return Response.json([{ team_match_id: '6354c9e5-ed61-4ccd-9a4d-6418fcf841be', reset_player_matches: 2 }]);
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    reset: { team_match_id: '6354c9e5-ed61-4ccd-9a4d-6418fcf841be', reset_player_matches: 2 },
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/rest\/v1\/rpc\/reset_dual_scorecard_qa$/);
  assert.equal(calls[0].init.headers['accept-profile'], 'jfl');
  assert.equal(calls[0].init.headers['content-profile'], 'jfl');
});

test('dual-team scorecard reset fails closed outside JFL', async () => {
  const env = { ...jflEnv(), ENVIRONMENT: 'gamma' };
  const response = await routeTestPersona(
    new Request('https://gamma.fremontderby.com/api/test-persona/dual-scorecard-reset', {
      method: 'POST',
      headers: { authorization: `Bearer ${JFL_SIMULATED_OIDC_ACCESS_TOKEN}` },
    }),
    env,
    { fetch: async () => { throw new Error('should not fetch'); } },
  );

  assert.equal(response.status, 404);
});

test('persona profile control documents both scoring sides and makes destructive reset unmistakable', async () => {
  const input = new Response('<html><body><div data-authenticated-content></div></body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const output = await injectTestPersonaControls(input);
  const html = await output.text();

  assert.match(html, /Admin Captain scores JFL QA Bank Shots/);
  assert.match(html, /Regular Captain scores JFL QA Table Testers/);
  assert.match(html, /Erase QA scores & reset test/);
  assert.match(html, /Persona switching by itself never resets scores/);
  assert.match(html, /\/api\/test-persona\/dual-scorecard-reset/);
});

test('JFL scorecard view gate explicitly admits only designated QA personas as rostered team members', async () => {
  const sql = await readFile(
    new URL('../supabase/migrations/20260904235900_jfl_dual_scorecard_persona_view_access.sql', import.meta.url),
    'utf8',
  );

  assert.match(sql, /create or replace function jfl_private\.can_score_player_match/);
  assert.match(sql, /18580000-0000-4000-8000-000000000002/);
  assert.match(sql, /18580000-0000-4000-8000-000000000003/);
  assert.match(sql, /JFL QA Bank Shots/);
  assert.match(sql, /JFL QA Table Testers/);
  assert.match(sql, /tm\.ends_at is null/);
  assert.match(sql, /tm\.role = 'captain'/);
});
