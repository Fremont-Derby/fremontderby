import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assignAdminTeamCaptainCommand,
  listAdminTeamCaptainCandidatesCommand,
} from '../src/adminSeasonTeamsCommands.js';
import { createAdminSeasonTeamsHttpHandlers } from '../src/adminSeasonTeamsHttp.js';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';
import { createAdminSeasonTeamsRepository } from '../src/adminSeasonTeamsRepository.js';

const migrationPath = new URL(
  '../supabase/migrations/20260812083500_admin_team_captain_assignment.sql',
  import.meta.url,
);
const routerPath = new URL('../src/adminSeasonTeamsRouter.js', import.meta.url);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('captain assignment migration preserves admin, captain, contact, activation, and audit boundaries', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /Actor is not a league admin/);
  assert.match(sql, /Team already has an active captain/);
  assert.match(sql, /Player already captains another team in this season/);
  assert.match(sql, /Phone number is required before assigning an active captain/);
  assert.match(sql, /Every confirmed team requires a captain with a phone number before publication/);
  assert.match(sql, /before insert or update of role, ends_at on public\.team_memberships/);
  assert.match(sql, /before update of status on public\.seasons/);
  assert.match(sql, /team\.admin_assign_captain/);
  assert.match(sql, /'hasPhone', target_has_phone/);
  assert.doesNotMatch(sql, /jsonb_build_object\([\s\S]{0,300}'phone'/i);
  assert.match(sql, /revoke all on function public\.admin_assign_team_captain[\s\S]*public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.admin_assign_team_captain[\s\S]*service_role/);
});

test('captain commands require human selection context and delegate to repository', async () => {
  const calls = [];
  const repository = {
    listCaptainCandidates(input) { calls.push(['list', input]); return []; },
    assignCaptain(input) { calls.push(['assign', input]); return { playerId: input.playerId }; },
  };
  await listAdminTeamCaptainCandidatesCommand({
    actorUserId: 'admin', seasonId: 'season-1', teamId: 'team-1',
  }, repository);
  await assignAdminTeamCaptainCommand({
    actorUserId: 'admin', seasonId: 'season-1', teamId: 'team-1', playerId: 'player-1',
  }, repository);
  assert.deepEqual(calls, [
    ['list', { actorUserId: 'admin', seasonId: 'season-1', teamId: 'team-1' }],
    ['assign', {
      actorUserId: 'admin', seasonId: 'season-1', teamId: 'team-1', playerId: 'player-1',
    }],
  ]);
});

test('captain HTTP handler authenticates actor and maps active-phone rejection to conflict', async () => {
  const calls = [];
  const handlers = createAdminSeasonTeamsHttpHandlers({
    authenticate: async () => ({ id: 'signed-in-admin' }),
    createRepository: () => ({
      assignCaptain(input) { calls.push(input); return { displayName: 'Pat', hasPhone: false }; },
    }),
  });
  const request = new Request('https://example.test/captain', {
    method: 'POST',
    body: JSON.stringify({ playerId: 'player-1' }),
  });
  const response = await handlers.assignCaptain(request, {}, 'season-1', 'team-1');
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [{
    actorUserId: 'signed-in-admin', seasonId: 'season-1', teamId: 'team-1', playerId: 'player-1',
  }]);

  const blocked = createAdminSeasonTeamsHttpHandlers({
    authenticate: async () => ({ id: 'signed-in-admin' }),
    createRepository: () => ({
      assignCaptain() { throw new Error('Phone number is required before assigning an active captain'); },
    }),
  });
  const blockedResponse = await blocked.assignCaptain(
    new Request('https://example.test/captain', {
      method: 'POST', body: JSON.stringify({ playerId: 'player-1' }),
    }),
    {},
    'season-1',
    'team-1',
  );
  assert.equal(blockedResponse.status, 409);
});

test('captain HTTP handler presents concurrent captaincy conflicts without backend wrappers', async () => {
  const handlers = createAdminSeasonTeamsHttpHandlers({
    authenticate: async () => ({ id: 'signed-in-admin' }),
    createRepository: () => ({
      assignCaptain() {
        throw new Error(
          'Supabase request failed with 400: Player already captains another open or live team',
        );
      },
    }),
  });

  const response = await handlers.assignCaptain(
    new Request('https://example.test/captain', {
      method: 'POST', body: JSON.stringify({ playerId: 'player-1' }),
    }),
    {},
    'season-1',
    'team-1',
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: 'This player already captains another open or live team.',
  });
});

test('captain repository uses service credentials and returns readiness without phone values', async () => {
  const requests = [];
  const repository = createAdminSeasonTeamsRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
    },
    {
      fetch: async (url, init) => {
        requests.push({ url, init });
        if (url.endsWith('/list_admin_team_captain_candidates')) {
          return jsonResponse([{
            player_id: 'player-1', display_name: 'Pat', has_login: false, has_phone: false,
            rostered_on_team: true, captain_team_id: null, captain_team_name: null,
          }]);
        }
        return jsonResponse([{
          team_id: 'team-1', player_id: 'player-1', display_name: 'Pat',
          has_login: false, has_phone: false,
        }]);
      },
    },
  );
  const candidates = await repository.listCaptainCandidates({
    actorUserId: 'admin', seasonId: 'season-1', teamId: 'team-1',
  });
  assert.deepEqual(candidates, [{
    playerId: 'player-1', displayName: 'Pat', hasLogin: false, hasPhone: false,
    rosteredOnTeam: true, captainTeamId: null, captainTeamName: null,
  }]);
  await repository.assignCaptain({
    actorUserId: 'admin', seasonId: 'season-1', teamId: 'team-1', playerId: 'player-1',
  });
  assert.match(requests[0].url, /rpc\/list_admin_team_captain_candidates$/);
  assert.match(requests[1].url, /rpc\/admin_assign_team_captain$/);
  assert.equal(requests[1].init.headers.authorization, 'Bearer service-secret');
  assert.deepEqual(JSON.parse(requests[1].init.body), {
    actor_user_id: 'admin', target_season_id: 'season-1', target_team_id: 'team-1',
    target_player_id: 'player-1',
  });
  assert.equal('phone' in candidates[0], false);
});

test('season teams UI offers a mobile captain picker with claimed/contact readiness', () => {
  const html = renderAdminSeasonTeamsPage();
  assert.match(html, /Assign captain/);
  assert.match(html, /captain-candidates/);
  assert.match(html, /Contact on file/);
  assert.match(html, /Phone missing/);
  assert.match(html, /Unclaimed/);
  assert.match(html, /Phone contact is required before the season becomes active/);
  assert.match(html, /\.captain-picker\{grid-column:1\/-1/);
  assert.match(html, /@media\(max-width:520px\)[\s\S]*\.captain-picker\{grid-template-columns:1fr\}/);
  assert.doesNotMatch(html, /phone\.value|player\.phone/i);
});

test('season teams router exposes captain candidates as GET and assignment as POST', async () => {
  const source = await readFile(routerPath, 'utf8');
  assert.match(source, /captain-candidates/);
  assert.match(source, /adminSeasonTeamsHttpHandlers\.listCaptainCandidates/);
  assert.match(source, /adminSeasonTeamsHttpHandlers\.assignCaptain/);
  assert.match(source, /\/captain\$\/[,\n]/);
});
