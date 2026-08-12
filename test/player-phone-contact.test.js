import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  getAdminPlayerContactCommand,
  setOwnPlayerContactCommand,
} from '../src/playerContactCommands.js';
import { createPlayerContactRepository } from '../src/playerContactRepository.js';
import { enhanceProfileContact } from '../src/profileContactEnhancer.js';

const migrationPath = new URL(
  '../supabase/migrations/20260812080000_player_phone_contact.sql',
  import.meta.url,
);
const routerPath = new URL('../src/routerEntry.js', import.meta.url);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('phone migration keeps contact private, admin-scoped, and audit-safe', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /private\.player_contacts/);
  assert.match(sql, /Active captains must keep a phone number on file/);
  assert.match(sql, /Actor is not a league admin/);
  assert.match(sql, /player\.phone_contact_update/);
  assert.match(sql, /jsonb_build_object\('hasPhone', normalized_phone is not null\)/);
  assert.doesNotMatch(sql, /after_state[\s\S]{0,160}'phone'/i);
  for (const fn of [
    'get_own_player_phone',
    'set_own_player_phone',
    'list_admin_player_contact_readiness',
    'get_admin_player_phone',
  ]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}[\\s\\S]*public, anon, authenticated`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}[\\s\\S]*service_role`));
  }
});

test('phone command validates human input and lets normal players clear contact', async () => {
  const calls = [];
  const repository = { setOwn(input) { calls.push(input); return input; } };
  await assert.rejects(
    setOwnPlayerContactCommand({ actorUserId: 'user-1', phone: '555' }, repository),
    /between 10 and 15 digits/,
  );
  await setOwnPlayerContactCommand({ actorUserId: 'user-1', phone: ' (206) 555-0123 ' }, repository);
  await setOwnPlayerContactCommand({ actorUserId: 'user-1', phone: '' }, repository);
  assert.deepEqual(calls, [
    { actorUserId: 'user-1', phone: '(206) 555-0123' },
    { actorUserId: 'user-1', phone: null },
  ]);
});

test('admin contact command requires a target player and delegates without exposing ids to browser input', async () => {
  const calls = [];
  const repository = { getAdminPlayer(input) { calls.push(input); return { phone: '2065550123' }; } };
  await assert.rejects(
    getAdminPlayerContactCommand({ actorUserId: 'admin' }, repository),
    /playerId is required/,
  );
  const result = await getAdminPlayerContactCommand({
    actorUserId: 'admin', playerId: 'player-1',
  }, repository);
  assert.equal(result.phone, '2065550123');
  assert.deepEqual(calls, [{ actorUserId: 'admin', playerId: 'player-1' }]);
});

test('contact repository uses only service-role RPC requests', async () => {
  const requests = [];
  const repository = createPlayerContactRepository(
    { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-secret' },
    {
      fetch: async (url, init) => {
        requests.push({ url, init });
        return jsonResponse([{ phone: '(206) 555-0123', has_phone: true }]);
      },
    },
  );
  await repository.getOwn({ actorUserId: 'user-1' });
  await repository.setOwn({ actorUserId: 'user-1', phone: '(206) 555-0123' });
  await repository.getAdminPlayer({ actorUserId: 'admin', playerId: 'player-1' });
  assert.deepEqual(requests.map(({ url }) => url.split('/').pop()), [
    'get_own_player_phone', 'set_own_player_phone', 'get_admin_player_phone',
  ]);
  for (const request of requests) assert.equal(request.init.headers.authorization, 'Bearer service-secret');
});

test('Profile contact enhancer is private, touch-friendly, and explains captain requirement', async () => {
  const response = new Response(
    '<html><head></head><body><section class="stack" data-authenticated-content hidden></section></body></html>',
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
  const html = await (await enhanceProfileContact(response)).text();
  assert.match(html, /Private contact/);
  assert.match(html, /type="tel"/);
  assert.match(html, /private league-administration contact information/i);
  assert.match(html, /active team captain/i);
  assert.match(html, /\/api\/me\/contact/);
  assert.match(html, /min-height:48px/);
});

test('router owns player contact API and enhances Profile', async () => {
  const source = await readFile(routerPath, 'utf8');
  assert.match(source, /routePlayerContact/);
  assert.match(source, /enhanceProfileContact/);
  assert.match(source, /playerContactResponse/);
});
