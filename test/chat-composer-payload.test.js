import test from 'node:test';
import assert from 'node:assert/strict';
import { chatSendPayload } from '../src/chatComposerPayload.js';

test('direct composer payload pins the open conversation', () => {
  assert.deepEqual(
    chatSendPayload({
      body: 'Confirming Tuesday.',
      clientMessageId: 'client-1',
      thread: { kind: 'direct', id: 'thread-target' },
    }),
    {
      body: 'Confirming Tuesday.',
      clientMessageId: 'client-1',
      expectedThreadId: 'thread-target',
      expectedConversationId: 'thread-target',
    },
  );
});

test('team composer payload pins the open team chat', () => {
  assert.equal(
    chatSendPayload({ body: 'hello', thread: { kind: 'team', id: 'team-a' } }).expectedTeamId,
    'team-a',
  );
});

test('league and matchup composer payloads pin season and match ids', () => {
  assert.equal(
    chatSendPayload({ body: 'hello', thread: { kind: 'league', id: 'season-1' } }).expectedSeasonId,
    'season-1',
  );
  assert.equal(
    chatSendPayload({ body: 'hello', thread: { kind: 'matchup', id: 'match-1' } }).expectedTeamMatchId,
    'match-1',
  );
});

test('missing thread id does not invent an expected pin', () => {
  assert.deepEqual(chatSendPayload({ body: 'hello' }), { body: 'hello' });
});
