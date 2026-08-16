import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createReadyCheckHttpHandlers } from '../src/readyCheckHttp.js';

test('router mounts team-scoped ready-check start', () => {
  const src = readFileSync(new URL('../src/router.js', import.meta.url), 'utf8');
  assert.match(src, /startForTeam/);
  assert.match(src, /ready-checks\?/);
});

test('startForTeam uses path teamId over body', async () => {
  const calls = [];
  const handlers = createReadyCheckHttpHandlers({
    authenticate: async () => ({ id: 'actor-1' }),
    createRepository: () => ({
      async start(args) {
        calls.push(args);
        return { id: 'rc-1', ...args };
      },
    }),
  });
  const request = new Request('https://example.test/api/teams/team-9/ready-check', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ roundId: 'round-1', teamId: 'ignored' }),
  });
  const response = await handlers.startForTeam(request, {}, 'team-9');
  assert.equal(response.status, 201);
  assert.equal(calls[0].teamId, 'team-9');
  assert.equal(calls[0].roundId, 'round-1');
});
