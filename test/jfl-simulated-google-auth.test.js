import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JFL_SIMULATED_GOOGLE_TOKEN,
  JFL_SIMULATED_OIDC_ACCESS_TOKEN,
  isJflSimulatedGoogleToken,
  resolveJflSimulatedGoogleActor,
  authenticateSupabaseUser,
  AuthError,
} from '../src/supabaseAuth.js';

test('simulated token helpers', () => {
  assert.equal(isJflSimulatedGoogleToken(JFL_SIMULATED_GOOGLE_TOKEN), true);
  assert.equal(isJflSimulatedGoogleToken('real-jwt'), false);
});

test('JFL accepts simulated google token when bypass on', () => {
  const actor = resolveJflSimulatedGoogleActor(JFL_SIMULATED_GOOGLE_TOKEN, {
    ENVIRONMENT: 'jfl',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '11111111-1111-1111-1111-111111111111',
    BETA_ACTOR_EMAIL: 'jfl-actor@fremontderby.com',
  });
  assert.equal(actor.jflSimulatedGoogle, true);
});

test('gamma rejects simulated google token', () => {
  assert.throws(
    () => resolveJflSimulatedGoogleActor(JFL_SIMULATED_GOOGLE_TOKEN, {
      ENVIRONMENT: 'gamma',
      BETA_AUTH_BYPASS: '1',
      BETA_ACTOR_USER_ID: 'x',
    }),
    (err) => err instanceof AuthError && err.status === 401,
  );
});

test('authenticateSupabaseUser accepts OIDC simulated token on JFL only', async () => {
  const actor = await authenticateSupabaseUser(
    { headers: { get: (k) => (String(k).toLowerCase() === 'authorization' ? `Bearer ${JFL_SIMULATED_OIDC_ACCESS_TOKEN}` : null) } },
    {
      ENVIRONMENT: 'jfl',
      BETA_AUTH_BYPASS: '1',
      BETA_ACTOR_USER_ID: '22222222-2222-2222-2222-222222222222',
      BETA_ACTOR_EMAIL: 'jfl@test',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'pub',
    },
    { fetch: async () => { throw new Error('should not call supabase'); } },
  );
  assert.equal(actor.simulatedOidc, true);
  assert.equal(actor.id, '22222222-2222-2222-2222-222222222222');
});

test('authenticateSupabaseUser rejects OIDC simulated token on gamma', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      { headers: { get: (k) => (String(k).toLowerCase() === 'authorization' ? `Bearer ${JFL_SIMULATED_OIDC_ACCESS_TOKEN}` : null) } },
      {
        ENVIRONMENT: 'gamma',
        BETA_AUTH_BYPASS: '1',
        BETA_ACTOR_USER_ID: 'x',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'pub',
      },
      { fetch: async () => { throw new Error('should not call supabase'); } },
    ),
    (err) => err instanceof AuthError,
  );
});
