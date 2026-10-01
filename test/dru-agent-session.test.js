import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authenticateSupabaseUser,
  DRU_AGENT_SENTINEL,
  druAgentSentinelEnabled,
} from '../src/supabaseAuth.js';
import { injectDruAgentSession } from '../src/druAgentSession.js';
import router from '../src/routerEntry.js';

function druEnv(overrides = {}) {
  return {
    ENVIRONMENT: 'dru',
    SUPABASE_URL: 'https://betabetabetabetabeta.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
    BETA_ACTOR_EMAIL: 'test@localhost',
    ...overrides,
  };
}

test('agent sentinel is DRU-only', () => {
  assert.equal(druAgentSentinelEnabled(druEnv()), true);
  assert.equal(druAgentSentinelEnabled(druEnv({ ENVIRONMENT: 'jfl' })), false);
  assert.equal(druAgentSentinelEnabled(druEnv({ ENVIRONMENT: 'gamma' })), false);
  assert.equal(druAgentSentinelEnabled(druEnv({ BETA_AUTH_BYPASS: '0' })), false);
});

test('DRU accepts the agent sentinel as the test actor', async () => {
  const actor = await authenticateSupabaseUser(
    new Request('https://dru.fremontderby.test/api/admin/players', {
      headers: { authorization: `Bearer ${DRU_AGENT_SENTINEL}` },
    }),
    druEnv(),
  );
  assert.equal(actor.id, '00000000-0000-4000-8000-000000000001');
  assert.equal(actor.betaBypass, true);
});

test('JFL and gamma reject the DRU sentinel', async () => {
  for (const environment of ['jfl', 'gamma', 'production']) {
    await assert.rejects(
      () => authenticateSupabaseUser(
        new Request('https://example.test/api/test', {
          headers: { authorization: `Bearer ${DRU_AGENT_SENTINEL}` },
        }),
        druEnv({ ENVIRONMENT: environment }),
        {
          fetch: async () => new Response('{"message":"invalid"}', {
            status: 401,
            headers: { 'content-type': 'application/json' },
          }),
        },
      ),
      (error) => error.name === 'AuthError',
    );
  }
});

test('DRU HTML pages receive the agent session bootstrap', async () => {
  const source = '<!doctype html><html><head><title>Setup</title></head><body><button>Sign in with Google</button></body></html>';
  const response = await injectDruAgentSession(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), druEnv());
  const html = await response.text();
  assert.match(html, /data-fd-dru-agent-session/);
  assert.match(html, /dru-bypass/);
  assert.match(html, /DRU test actor is signed in/);
});

test('gamma HTML pages do not receive the agent session bootstrap', async () => {
  const source = '<!doctype html><html><head></head><body></body></html>';
  const response = await injectDruAgentSession(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), druEnv({ ENVIRONMENT: 'gamma' }));
  const html = await response.text();
  assert.doesNotMatch(html, /data-fd-dru-agent-session/);
});

test('router plants the agent session on DRU season-setup', async () => {
  const response = await router.fetch(
    new Request('https://dru.fremontderby.test/season-setup'),
    druEnv(),
    {},
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /data-fd-dru-agent-session/);
  assert.match(html, /data-fd-persistent-auth/);
});
