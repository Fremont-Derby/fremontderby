import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createDateAvailabilityRepository } from '../src/dateAvailabilityRepository.js';
import { enhanceScheduleAvailability } from '../src/scheduleAvailabilityEnhancer.js';

const migrationPath = new URL(
  '../supabase/migrations/20260812025500_player_date_availability.sql',
  import.meta.url,
);
const routerEntryPath = new URL('../src/routerEntry.js', import.meta.url);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('dated availability migration is personal, date-keyed, unsure-by-default, and service-role only', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /primary key \(season_id, player_id, availability_date\)/);
  assert.match(sql, /coalesce\(pda\.status, 'unsure'::text\)/);
  assert.match(sql, /sp\.status = 'active'/);
  assert.match(sql, /r\.scheduled_on = target_availability_date/);
  assert.match(sql, /on conflict on constraint player_date_availability_pkey do update/);
  assert.match(sql, /revoke all on function public\.get_own_date_availability[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.get_own_date_availability[\s\S]*to service_role/);
  assert.match(sql, /revoke all on function public\.set_own_date_availability[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.set_own_date_availability[\s\S]*to service_role/);
});

test('dated availability repository uses actor-scoped service-role RPCs', async () => {
  const requests = [];
  const repository = createDateAvailabilityRepository(
    { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-secret' },
    {
      fetch: async (url, init) => {
        requests.push({ url, init });
        return jsonResponse([{
          season_id: 'season-1',
          player_id: 'player-1',
          availability_date: '2026-08-20',
          availability_status: 'available',
          registered: true,
        }]);
      },
    },
  );

  await repository.getOwn({ actorUserId: 'user-1', seasonId: 'season-1', availabilityDate: '2026-08-20' });
  await repository.setOwn({ actorUserId: 'user-1', seasonId: 'season-1', availabilityDate: '2026-08-20', availabilityStatus: 'unavailable' });

  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /\/rpc\/get_own_date_availability$/);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    actor_user_id: 'user-1',
    target_season_id: 'season-1',
    target_availability_date: '2026-08-20',
  });
  assert.match(requests[1].url, /\/rpc\/set_own_date_availability$/);
  assert.deepEqual(JSON.parse(requests[1].init.body), {
    actor_user_id: 'user-1',
    target_season_id: 'season-1',
    target_availability_date: '2026-08-20',
    availability_status: 'unavailable',
  });
  assert.equal(requests[1].init.headers.authorization, 'Bearer service-secret');
});

test('Schedule enhancement exposes accessible three-state date-wide check-in and truthful signed-out state', async () => {
  const response = new Response('<!doctype html><style>:root{--line:#333;--muted:#aaa;--gold:#db4}</style><body><select data-season-select></select><select data-round-select></select><div class="matches" data-match-list></div></body>', { headers: { 'content-type': 'text/html' } });
  const enhanced = await enhanceScheduleAvailability(response);
  const html = await enhanced.text();
  assert.match(html, /Your availability/);
  assert.match(html, /data-availability-value="available"/);
  assert.match(html, /data-availability-value="unsure"/);
  assert.match(html, /data-availability-value="unavailable"/);
  assert.match(html, /Missing response defaults to Unsure/);
  assert.match(html, /Sign in on Profile to mark your availability/);
  assert.match(html, /min-height:48px/);
  assert.match(html, /aria-live="polite"/);
});

test('router entry handles dated availability API and enhances Schedule only', async () => {
  const source = await readFile(routerEntryPath, 'utf8');
  assert.match(source, /routeDateAvailability/);
  assert.match(source, /const dateAvailabilityResponse = await routeDateAvailability\(request, env\)/);
  assert.match(source, /url\.pathname === '\/schedule'/);
  assert.match(source, /enhanceScheduleAvailability\(reconciled\)/);
});
