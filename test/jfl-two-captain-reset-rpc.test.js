import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resetJflTwoCaptainFixture } from '../scripts/reset-jfl-two-captain.mjs';

const migration = await readFile(new URL('../supabase/migrations/20261002172005_jfl_two_captain_reset_rpc.sql', import.meta.url), 'utf8');
const fixtureId = '18580000-1300-4000-8000-000000000001';

test('JFL reset RPC is invoker-rights, fixture-scoped, and service-role-only', () => {
  assert.match(migration, /security invoker/i);
  assert.match(migration, /s\.purpose = 'qa'/i);
  assert.match(migration, /raise exception 'The exact JFL two-captain QA matchup is required'/i);
  assert.match(migration, /revoke all on function jfl\.reset_two_captain_qa\(\) from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function jfl\.reset_two_captain_qa\(\) to service_role/i);
  assert.match(migration, new RegExp(fixtureId));
  assert.doesNotMatch(migration, /\b(public|private|dru|gamma)\./i);
});

test('hosted preflight checks exact live SHA before reset and never exposes the key in errors', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (String(url).endsWith('/health/environment')) {
      return { ok: true, json: async () => ({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: 'sha' }) };
    }
    return { ok: true, json: async () => ([{ team_match_id: fixtureId, reset_lineups: 1 }]) };
  };
  const result = await resetJflTwoCaptainFixture({ fetchImpl, serviceRoleKey: 'test-secret', expectedSha: 'sha' });
  assert.equal(result.resetLineups, 1);
  assert.equal(calls.length, 3);
  assert.match(calls[1].url, /oqkkvqkerusepyokzbmt\.supabase\.co\/rest\/v1\/rpc\/reset_two_captain_qa$/);
  assert.equal(calls[1].options.headers['content-profile'], 'jfl');

  await assert.rejects(
    resetJflTwoCaptainFixture({ fetchImpl: async () => ({ ok: false, status: 403 }), serviceRoleKey: 'test-secret', expectedSha: 'sha' }),
    (error) => !error.message.includes('test-secret'),
  );
});
