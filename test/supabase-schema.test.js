import test from 'node:test';
import assert from 'node:assert/strict';
import {
  configuredSupabaseSchema,
  withSupabaseSchema,
} from '../src/supabaseSchema.js';

test('REST requests receive the exact lane profile headers', async () => {
  let observed;
  const fetch = withSupabaseSchema(async (input, init) => {
    observed = { input, headers: new Headers(init.headers) };
    return new Response('{}');
  }, { ENVIRONMENT: 'jfl', SUPABASE_SCHEMA: 'jfl' });

  await fetch('https://oqkkvqkerusepyokzbmt.supabase.co/rest/v1/rpc/example', {
    method: 'POST',
    headers: { apikey: 'server-key' },
  });

  assert.equal(observed.headers.get('accept-profile'), 'jfl');
  assert.equal(observed.headers.get('content-profile'), 'jfl');
  assert.equal(observed.headers.get('apikey'), 'server-key');
});

test('auth requests are not given PostgREST profile headers', async () => {
  let observed;
  const fetch = withSupabaseSchema(async (input, init) => {
    observed = new Headers(init.headers);
    return new Response('{}');
  }, { ENVIRONMENT: 'dru', SUPABASE_SCHEMA: 'dru' });
  await fetch('https://oqkkvqkerusepyokzbmt.supabase.co/auth/v1/user', { headers: { apikey: 'key' } });
  assert.equal(observed.get('accept-profile'), null);
  assert.equal(observed.get('content-profile'), null);
});

test('schema mismatch and unknown environments fail closed', () => {
  assert.throws(
    () => configuredSupabaseSchema({ ENVIRONMENT: 'jfl', SUPABASE_SCHEMA: 'gamma' }),
    /does not match Worker environment/,
  );
  assert.throws(() => configuredSupabaseSchema({ ENVIRONMENT: 'unknown' }), /Unknown Worker environment/);
});
