import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  handleSendDirectMessageRequest,
  handleSendTeamMessageRequest,
} from '../src/chatHttp.js';

function createFetch(responses) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({ url, init });
      const next = responses.shift() ?? { body: [] };
      return new Response(JSON.stringify(next.body), { status: next.status ?? 200 });
    },
  };
}

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
};

test('chat HTTP source forwards expected thread ids on send handlers', () => {
  const source = readFileSync(new URL('../src/chatHttp.js', import.meta.url), 'utf8');
  assert.match(source, /function expectedThreadId/);
  assert.match(source, /expectedConversationId/);
  assert.match(source, /expectedTeamId/);
  assert.match(source, /expectedSeasonId/);
  assert.match(source, /expectedTeamMatchId/);
});

test('direct send with mismatched expectedConversationId does not write', async () => {
  const { fetch, calls } = createFetch([
    { body: { id: 'user-1' } },
  ]);
  const request = new Request(
    'https://fremontderby.com/api/direct-conversations/conversation-distractor/messages',
    {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: JSON.stringify({
        body: 'Hello',
        expectedConversationId: 'conversation-target',
      }),
    },
  );
  const response = await handleSendDirectMessageRequest(
    request,
    env,
    'conversation-distractor',
    { fetch },
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /open conversation/);
  assert.equal(calls.length, 1, 'auth only; repository send must not run');
});

test('team send with mismatched expectedTeamId does not write', async () => {
  const { fetch, calls } = createFetch([
    { body: { id: 'user-1' } },
  ]);
  const request = new Request('https://fremontderby.com/api/teams/team-b/messages', {
    method: 'POST',
    headers: { authorization: 'Bearer token' },
    body: JSON.stringify({ body: 'Hello', expectedTeamId: 'team-a' }),
  });
  const response = await handleSendTeamMessageRequest(request, env, 'team-b', { fetch });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /open team chat/);
  assert.equal(calls.length, 1);
});
