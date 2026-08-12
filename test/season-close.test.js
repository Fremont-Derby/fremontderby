import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  closeSeasonCommand,
  getSeasonCloseReadinessCommand,
} from '../src/seasonCloseCommands.js';
import { enhanceSeasonClose } from '../src/seasonCloseEnhancer.js';
import { createSeasonCloseRepository } from '../src/seasonCloseRepository.js';

const migrationPath = new URL('../supabase/migrations/20260812095000_explicit_season_close.sql', import.meta.url);
const routerPath = new URL('../src/routerEntry.js', import.meta.url);

test('season close migration makes complete an explicit audited admin transition', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /guard_explicit_season_close/);
  assert.match(sql, /current_setting\('fremont\.explicit_season_close'/);
  assert.match(sql, /current_status = 'playoffs'/);
  assert.match(sql, /r\.stage in \('semifinal', 'championship', 'tiebreaker'\)/);
  assert.match(sql, /pm\.status not in \('finalized', 'corrected'\)/);
  assert.match(sql, /'season\.close'/);
  assert.match(sql, /revoke all on function public\.close_season\(uuid, uuid\)[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.close_season\(uuid, uuid\) to service_role/);
  assert.doesNotMatch(sql, /delete from public\.(matches|rounds|player_matches|player_match_racks|teams)/i);
});

test('season close commands validate identity and preserve repository boundary', async () => {
  const calls = [];
  const repository = {
    async getCloseReadiness(payload) { calls.push(['readiness', payload]); return { ready: true }; },
    async closeSeason(payload) { calls.push(['close', payload]); return { season_status: 'complete' }; },
  };
  assert.deepEqual(await getSeasonCloseReadinessCommand({ actorUserId: ' actor ', seasonId: ' season ' }, repository), { ready: true });
  assert.deepEqual(await closeSeasonCommand({ actorUserId: 'actor', seasonId: 'season' }, repository), { season_status: 'complete' });
  assert.deepEqual(calls, [
    ['readiness', { actorUserId: 'actor', seasonId: 'season' }],
    ['close', { actorUserId: 'actor', seasonId: 'season' }],
  ]);
  await assert.rejects(() => closeSeasonCommand({ actorUserId: '', seasonId: 'season' }, repository), /actorUserId is required/);
});

test('season close repository uses service-role RPC calls without exposing credentials in payload', async () => {
  const requests = [];
  const repository = createSeasonCloseRepository(
    { SUPABASE_URL: 'https://example.supabase.co/', SUPABASE_SERVICE_ROLE_KEY: 'server-secret' },
    { fetch: async (url, init) => {
      requests.push({ url, init });
      return new Response(JSON.stringify([{ ready: true }]), { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  );
  await repository.getCloseReadiness({ actorUserId: 'actor', seasonId: 'season' });
  assert.equal(requests[0].url, 'https://example.supabase.co/rest/v1/rpc/get_season_close_readiness');
  assert.equal(requests[0].init.headers.authorization, 'Bearer server-secret');
  assert.deepEqual(JSON.parse(requests[0].init.body), { actor_user_id: 'actor', target_season_id: 'season' });
});

test('season setup receives explicit accessible Close season workflow', async () => {
  const response = new Response('<html><body><main><select data-season-selector><option value="s1">Season 1</option></select></main></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const enhanced = await enhanceSeasonClose(response);
  const html = await enhanced.text();
  assert.match(html, /data-season-close-workflow/);
  assert.match(html, />Close season</);
  assert.match(html, /min-height:48px/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Closing preserves standings, matches, player history, payments, and audit history/);
  assert.match(html, /close-readiness/);
  assert.match(html, /\/close'/);
});

test('router entry owns close API and season setup enhancer before legacy fallthrough', async () => {
  const source = await readFile(routerPath, 'utf8');
  assert.match(source, /routeSeasonClose\(request, env\)/);
  assert.match(source, /enhanceSeasonClose\(reconciled\)/);
});
