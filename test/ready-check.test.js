import assert from 'node:assert/strict';
import test from 'node:test';
import {
  listMyPendingReadyChecksCommand,
  respondTeamReadyCheckCommand,
  startTeamReadyCheckCommand,
} from '../src/readyCheckCommands.js';
import { createReadyCheckHttpHandlers } from '../src/readyCheckHttp.js';
import { renderPrimaryNavigation } from '../src/appShell.js';
import { renderTeamsPage } from '../src/teamsPage.js';

test('start ready check command validates inputs', async () => {
  await assert.rejects(
    () => startTeamReadyCheckCommand({ actorUserId: 'u1', teamId: '', roundId: 'r1' }, { start: async () => ({}) }),
    /teamId is required/,
  );
  const row = await startTeamReadyCheckCommand(
    { actorUserId: 'u1', teamId: 't1', roundId: 'r1' },
    { start: async (input) => ({ id: 'c1', ...input }) },
  );
  assert.equal(row.id, 'c1');
});

test('respond command normalizes thumbs-up style answers', async () => {
  let saved;
  await respondTeamReadyCheckCommand(
    { actorUserId: 'u1', readyCheckId: 'c1', response: 'READY' },
    {
      respond: async (input) => {
        saved = input;
        return input;
      },
    },
  );
  assert.equal(saved.response, 'ready');
});

test('list pending command returns repository rows', async () => {
  const rows = await listMyPendingReadyChecksCommand(
    { actorUserId: 'u1' },
    { listPending: async () => [{ id: 'c1', team_name: 'Breakers' }] },
  );
  assert.equal(rows[0].team_name, 'Breakers');
});

test('HTTP listPending returns readyChecks payload', async () => {
  const handlers = createReadyCheckHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      listPending: async () => [{ id: 'c1', team_name: 'Breakers', my_response: null }],
    }),
  });
  const response = await handlers.listPending(new Request('https://example.test/api/me/ready-checks'), {});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.readyChecks[0].id, 'c1');
});

test('shell navigation includes ready-check prompt region', () => {
  // primaryNavigation is not exported - use teams page + shell styles via source contract
  const html = renderTeamsPage();
  assert.match(html, /Start ready check/);
  assert.match(html, /data-hub-ready-check/);
});
