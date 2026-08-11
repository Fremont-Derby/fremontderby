import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createAdminPlayersRepository } from '../src/adminPlayersRepository.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

const migrationPath = new URL(
  '../supabase/migrations/20260811223000_admin_player_role_management.sql',
  import.meta.url,
);
const routerPath = new URL('../src/router.js', import.meta.url);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('admin role migration keeps role changes server-only, audited, and protects last admin', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /private\.league_admins/);
  assert.match(sql, /Actor is not a league admin/);
  assert.match(sql, /The last league admin cannot be removed/);
  assert.match(sql, /player\.grant_admin/);
  assert.match(sql, /player\.revoke_admin/);
  assert.match(sql, /insert into private\.audit_events/);
  assert.match(sql, /revoke all on function public\.set_league_admin_role[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.set_league_admin_role[\s\S]*to service_role/);
});

test('admin player repository uses service role RPCs and normalizes player rows', async () => {
  const requests = [];
  const repository = createAdminPlayersRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
    },
    {
      fetch: async (url, init) => {
        requests.push({ url, init });
        if (url.endsWith('/rpc/list_admin_players')) {
          return jsonResponse([{
            player_id: 'player-1',
            display_name: 'Alex Example',
            has_login: true,
            is_league_admin: false,
            teams: [{ teamId: 'team-1', teamName: 'Breakers' }],
          }]);
        }
        return jsonResponse([{ player_id: 'player-1', is_league_admin: true }]);
      },
    },
  );

  const players = await repository.listPlayers({ actorUserId: 'admin-user' });
  assert.deepEqual(players, [{
    playerId: 'player-1',
    displayName: 'Alex Example',
    hasLogin: true,
    isLeagueAdmin: false,
    teams: [{ teamId: 'team-1', teamName: 'Breakers' }],
    currentSeasonId: null,
    currentSeasonName: null,
    registrationStatus: null,
    paymentStatus: null,
    competitionEligible: true,
    ineligibilityReason: null,
  }]);

  const role = await repository.setAdminRole({
    actorUserId: 'admin-user',
    playerId: 'player-1',
    enabled: true,
    reason: 'Backup league operator',
  });
  assert.deepEqual(role, { playerId: 'player-1', isLeagueAdmin: true });
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.init.headers.authorization, 'Bearer service-secret');
    assert.equal(request.init.headers.apikey, 'service-secret');
  }
  assert.deepEqual(JSON.parse(requests[1].init.body), {
    actor_user_id: 'admin-user',
    target_player_id: 'player-1',
    enabled: true,
    change_reason: 'Backup league operator',
  });
});

test('player management page is human-readable, searchable, confirmable, and mobile-safe', () => {
  const html = renderAdminPlayersPage();
  assert.match(html, /Admin · League Management/);
  assert.match(html, /Search player name/);
  assert.match(html, /Grant admin/);
  assert.match(html, /Revoke admin/);
  assert.match(html, /confirm\(/);
  assert.match(html, /No active team memberships/);
  assert.match(html, /@media\(max-width:640px\)/);
  assert.doesNotMatch(html, /Enter player ID/i);
});

test('router exposes protected admin player page and role endpoints', async () => {
  const source = await readFile(routerPath, 'utf8');
  assert.match(source, /renderAdminPlayersPage/);
  assert.match(source, /url\.pathname === '\/admin\/players'/);
  assert.match(source, /url\.pathname === '\/api\/admin\/players'/);
  assert.match(source, /adminPlayerRoleMatch/);
  assert.match(source, /adminPlayersHttpHandlers\.setAdminRole/);
});
