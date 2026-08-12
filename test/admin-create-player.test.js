import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createAdminPlayersRepository } from '../src/adminPlayersRepository.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

const migrationPath = new URL(
  '../supabase/migrations/20260812002000_admin_create_unclaimed_player.sql',
  import.meta.url,
);
const routerEntryPath = new URL('../src/routerEntry.js', import.meta.url);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('admin create player migration is admin-only, unclaimed, duplicate-aware, and audited', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /Actor is not a league admin/);
  assert.match(sql, /values \(null, cleaned_name\)/);
  assert.match(sql, /already exists\. Use the existing player or explicitly confirm a duplicate/);
  assert.match(sql, /player\.admin_create/);
  assert.match(sql, /explicitDuplicateOverride/);
  assert.match(sql, /insert into private\.audit_events/);
  assert.match(sql, /revoke all on function public\.admin_create_unclaimed_player[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.admin_create_unclaimed_player[\s\S]*to service_role/);
});

test('admin player repository creates an unclaimed player through service-role RPC', async () => {
  const requests = [];
  const repository = createAdminPlayersRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
    },
    {
      fetch: async (url, init) => {
        requests.push({ url, init });
        return jsonResponse([{
          player_id: 'player-new',
          display_name: 'New Player',
          has_login: false,
        }]);
      },
    },
  );

  const player = await repository.createPlayer({
    actorUserId: 'admin-user',
    displayName: 'New Player',
  });

  assert.deepEqual(player, {
    playerId: 'player-new',
    displayName: 'New Player',
    hasLogin: false,
  });
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /\/rpc\/admin_create_unclaimed_player$/);
  assert.equal(requests[0].init.headers.authorization, 'Bearer service-secret');
  assert.equal(requests[0].init.headers.apikey, 'service-secret');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    actor_user_id: 'admin-user',
    target_display_name: 'New Player',
    allow_exact_duplicate: false,
  });
});

test('admin players page exposes phone-safe creation, explicit Unclaimed state, and duplicate confirmation', () => {
  const html = renderAdminPlayersPage();
  assert.match(html, /data-create-form/);
  assert.match(html, />Create player</);
  assert.match(html, /maxlength="80"/);
  assert.match(html, /'Unclaimed'/);
  assert.match(html, /Create a separate player with the same name anyway/);
  assert.match(html, /body\.player\.displayName/);
  assert.match(html, /@media\(max-width:640px\)/);
  assert.match(html, /min-height:48px/);
  assert.doesNotMatch(html, /auth user id|supabase identifier|email address/i);
});

test('router entry intercepts POST admin player creation before legacy GET routing', async () => {
  const source = await readFile(routerEntryPath, 'utf8');
  assert.match(source, /handleCreateAdminPlayerRequest/);
  assert.match(source, /url\.pathname === '\/api\/admin\/players'/);
  assert.match(source, /request\.method === 'POST'/);
  assert.match(source, /return handleCreateAdminPlayerRequest\(request, env\)/);
});
