import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  addAdminSeasonTeamCommand,
  listAdminSeasonTeamsCommand,
} from '../src/adminSeasonTeamsCommands.js';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';
import { createAdminSeasonTeamsRepository } from '../src/adminSeasonTeamsRepository.js';

const migrationPath = new URL(
  '../supabase/migrations/20260811234500_admin_season_team_assignment.sql',
  import.meta.url,
);
const routerPath = new URL('../src/adminSeasonTeamsRouter.js', import.meta.url);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('season team assignment migration is capacity-safe, audited, and never copies a returning roster', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /Actor is not a league admin/);
  assert.match(sql, /season_team_capacity:/);
  assert.match(sql, /No team slots are currently available/);
  assert.match(sql, /season\.admin_add_team/);
  assert.match(sql, /'copiedRoster', false/);
  assert.doesNotMatch(sql, /insert into public\.team_memberships[\s\S]*source_team/i);
  assert.match(sql, /revoke all on function public\.admin_add_team_to_season[\s\S]*public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.admin_add_team_to_season[\s\S]*service_role/);
});

test('season team admin commands require human-selected season and team context', async () => {
  const calls = [];
  const repository = {
    list(input) { calls.push(['list', input]); return { teams: [] }; },
    add(input) { calls.push(['add', input]); return { teamId: input.teamId }; },
  };
  await listAdminSeasonTeamsCommand({ actorUserId: 'admin', seasonId: 'season-1' }, repository);
  await addAdminSeasonTeamCommand({ actorUserId: 'admin', seasonId: 'season-1', teamId: 'team-1' }, repository);
  assert.deepEqual(calls, [
    ['list', { actorUserId: 'admin', seasonId: 'season-1' }],
    ['add', { actorUserId: 'admin', seasonId: 'season-1', teamId: 'team-1' }],
  ]);
  await assert.rejects(
    () => addAdminSeasonTeamCommand({ actorUserId: 'admin', seasonId: 'season-1' }, repository),
    /teamId is required/,
  );
});

test('season team repository keeps all privileged database calls behind the service role', async () => {
  const requests = [];
  const repository = createAdminSeasonTeamsRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
    },
    {
      fetch: async (url, init) => {
        requests.push({ url, init });
        if (url.endsWith('/rpc/get_admin_season_registration')) {
          return jsonResponse([{ registration: { teamCapacity: 8, counts: { occupiedSlots: 2 } } }]);
        }
        if (url.endsWith('/rpc/list_admin_season_team_candidates')) {
          return jsonResponse([{ candidate_kind: 'returning', team_id: 'team-old', team_name: 'Breakers' }]);
        }
        return jsonResponse([{ slot_id: 'slot-1', team_id: 'team-new', team_name: 'Breakers' }]);
      },
    },
  );

  const state = await repository.list({ actorUserId: 'admin', seasonId: 'season-1' });
  assert.equal(state.registration.teamCapacity, 8);
  assert.equal(state.teams[0].candidate_kind, 'returning');
  const added = await repository.add({ actorUserId: 'admin', seasonId: 'season-1', teamId: 'team-old' });
  assert.equal(added.slot_id, 'slot-1');
  assert.equal(requests.length, 3);
  for (const request of requests) {
    assert.equal(request.init.headers.authorization, 'Bearer service-secret');
    assert.equal(request.init.headers.apikey, 'service-secret');
  }
  assert.deepEqual(JSON.parse(requests[2].init.body), {
    actor_user_id: 'admin',
    target_season_id: 'season-1',
    candidate_team_id: 'team-old',
  });
});

test('season team page is searchable, tabbed, capacity-aware, and mobile-first', () => {
  const html = renderAdminSeasonTeamsPage();
  assert.match(html, /Season teams/);
  assert.match(html, /Returning/);
  assert.match(html, /New/);
  assert.match(html, /In season/);
  assert.match(html, /Find a team/);
  assert.match(html, /Add to season/);
  assert.match(html, /of '+total+' teams/);
  assert.match(html, /@media\(max-width:520px\)/);
  assert.doesNotMatch(html, /Enter team ID/i);
  assert.doesNotMatch(html, /<table/i);
});

test('season team router exposes page and protected list/add endpoints', async () => {
  const source = await readFile(routerPath, 'utf8');
  assert.match(source, /\/admin\/season-teams/);
  assert.match(source, /team-candidates/);
  assert.match(source, /adminSeasonTeamsHttpHandlers\.list/);
  assert.match(source, /adminSeasonTeamsHttpHandlers\.add/);
});
