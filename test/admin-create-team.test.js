import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createPreparedAdminSeasonTeamCommand } from '../src/adminSeasonTeamsCommands.js';
import { createAdminSeasonTeamsHttpHandlers } from '../src/adminSeasonTeamsHttp.js';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';
import { createAdminSeasonTeamsRepository } from '../src/adminSeasonTeamsRepository.js';

const migrationPath = new URL(
  '../supabase/migrations/20260812070000_admin_create_prepared_team.sql',
  import.meta.url,
);
const routerPath = new URL('../src/adminSeasonTeamsRouter.js', import.meta.url);

function postRequest(body) {
  return new Request('https://example.test/api/admin/seasons/season-1/prepared-teams', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('prepared team migration is admin-only, audited, duplicate-safe, and creates no captain or slot', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /Actor is not a league admin/);
  assert.match(sql, /A team with this name already exists/);
  assert.match(sql, /team\.admin_create_prepared/);
  assert.match(sql, /'captainAssigned', false/);
  assert.match(sql, /'slotAssigned', false/);
  assert.doesNotMatch(sql, /insert into public\.team_memberships/i);
  assert.doesNotMatch(sql, /insert into private\.season_team_slots/i);
  assert.match(sql, /revoke all on function public\.admin_create_prepared_team[\s\S]*public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.admin_create_prepared_team[\s\S]*service_role/);
});

test('prepared team command trims human name and does not require a captain id', async () => {
  const calls = [];
  const repository = {
    createPrepared(input) { calls.push(input); return { id: 'team-1', name: input.teamName }; },
  };
  const result = await createPreparedAdminSeasonTeamCommand({
    actorUserId: 'admin',
    seasonId: 'season-1',
    teamName: '  Corner Pocket  ',
  }, repository);
  assert.equal(result.name, 'Corner Pocket');
  assert.deepEqual(calls, [{
    actorUserId: 'admin',
    seasonId: 'season-1',
    teamName: 'Corner Pocket',
  }]);
});

test('prepared team HTTP handler uses authenticated actor and returns duplicate conflict', async () => {
  const calls = [];
  const handlers = createAdminSeasonTeamsHttpHandlers({
    authenticate: async () => ({ id: 'signed-in-admin' }),
    createRepository: () => ({
      createPrepared(input) { calls.push(input); return { id: 'team-1', name: input.teamName }; },
    }),
  });
  const response = await handlers.createPrepared(postRequest({ teamName: 'Corner Pocket' }), {}, 'season-1');
  assert.equal(response.status, 201);
  assert.deepEqual(calls, [{
    actorUserId: 'signed-in-admin',
    seasonId: 'season-1',
    teamName: 'Corner Pocket',
  }]);

  const duplicateHandlers = createAdminSeasonTeamsHttpHandlers({
    authenticate: async () => ({ id: 'signed-in-admin' }),
    createRepository: () => ({
      createPrepared() { throw new Error('A team with this name already exists. Search Returning or New to reuse it.'); },
    }),
  });
  const duplicate = await duplicateHandlers.createPrepared(postRequest({ teamName: 'Corner Pocket' }), {}, 'season-1');
  assert.equal(duplicate.status, 409);
});

test('prepared team repository calls only the server-side RPC with service credentials', async () => {
  const requests = [];
  const repository = createAdminSeasonTeamsRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
    },
    {
      fetch: async (url, init) => {
        requests.push({ url, init });
        return jsonResponse([{ id: 'team-1', season_id: 'season-1', name: 'Corner Pocket' }]);
      },
    },
  );
  const result = await repository.createPrepared({
    actorUserId: 'admin',
    seasonId: 'season-1',
    teamName: 'Corner Pocket',
  });
  assert.equal(result.id, 'team-1');
  assert.match(requests[0].url, /rpc\/admin_create_prepared_team$/);
  assert.equal(requests[0].init.headers.authorization, 'Bearer service-secret');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    actor_user_id: 'admin',
    target_season_id: 'season-1',
    team_name: 'Corner Pocket',
  });
});

test('season teams UI exposes a phone-safe create flow and clear prepared state', () => {
  const html = renderAdminSeasonTeamsPage();
  assert.match(html, /Create team/);
  assert.match(html, /New team name/);
  assert.match(html, /Not in season/);
  assert.match(html, /prepared-teams/);
  assert.match(html, /createForm\.hidden=true/);
  assert.match(html, /@media\(max-width:520px\)/);
  assert.doesNotMatch(html, /Team ID/i);
});

test('season teams router exposes prepared team creation as POST', async () => {
  const source = await readFile(routerPath, 'utf8');
  assert.match(source, /prepared-teams/);
  assert.match(source, /request\.method !== 'POST'/);
  assert.match(source, /adminSeasonTeamsHttpHandlers\.createPrepared/);
});
