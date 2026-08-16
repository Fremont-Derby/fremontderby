import test from 'node:test';
import assert from 'node:assert/strict';
import {
  configuredSupabaseSchema,
  privatePostgrestProfile,
  resolvePostgrestProfile,
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

test('private token maps to lane_private and is set on both profile headers', async () => {
  let headers;
  const fetch = withSupabaseSchema(async (_input, init) => {
    headers = new Headers(init.headers);
    return new Response('{}');
  }, { ENVIRONMENT: 'dru', SUPABASE_SCHEMA: 'dru' });

  await fetch('https://oqkkvqkerusepyokzbmt.supabase.co/rest/v1/league_admins?select=user_id', {
    headers: { 'accept-profile': 'private', apikey: 'k' },
  });

  assert.equal(headers.get('accept-profile'), 'dru_private');
  assert.equal(headers.get('content-profile'), 'dru_private');
});

test('already-qualified lane private profile is preserved', async () => {
  let headers;
  const fetch = withSupabaseSchema(async (_input, init) => {
    headers = new Headers(init.headers);
    return new Response('{}');
  }, { ENVIRONMENT: 'dru', SUPABASE_SCHEMA: 'dru' });

  await fetch('https://oqkkvqkerusepyokzbmt.supabase.co/rest/v1/payment_status?select=player_id', {
    headers: { 'Accept-Profile': 'dru_private' },
  });

  assert.equal(headers.get('accept-profile'), 'dru_private');
  assert.equal(headers.get('content-profile'), 'dru_private');
});

test('foreign lane profile is forced back to this Worker schema', async () => {
  let headers;
  const fetch = withSupabaseSchema(async (_input, init) => {
    headers = new Headers(init.headers);
    return new Response('{}');
  }, { ENVIRONMENT: 'jfl', SUPABASE_SCHEMA: 'jfl' });

  await fetch('https://oqkkvqkerusepyokzbmt.supabase.co/rest/v1/players?select=id', {
    headers: { 'accept-profile': 'dru', 'content-profile': 'dru' },
  });

  assert.equal(headers.get('accept-profile'), 'jfl');
  assert.equal(headers.get('content-profile'), 'jfl');
});

test('production private profile stays private not public_private', async () => {
  let headers;
  const fetch = withSupabaseSchema(async (_input, init) => {
    headers = new Headers(init.headers);
    return new Response('{}');
  }, { ENVIRONMENT: 'production', SUPABASE_SCHEMA: 'public' });

  await fetch('https://cpiucsxlkicmlbvdvhww.supabase.co/rest/v1/league_admins?select=user_id', {
    headers: { 'accept-profile': 'private' },
  });

  assert.equal(headers.get('accept-profile'), 'private');
  assert.equal(headers.get('content-profile'), 'private');
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

test('resolvePostgrestProfile covers private aliases', () => {
  assert.equal(resolvePostgrestProfile('dru', ''), 'dru');
  assert.equal(resolvePostgrestProfile('dru', 'private'), 'dru_private');
  assert.equal(resolvePostgrestProfile('dru', 'dru_private'), 'dru_private');
  assert.equal(resolvePostgrestProfile('public', 'private'), 'private');
  assert.equal(privatePostgrestProfile('gamma'), 'gamma_private');
});
