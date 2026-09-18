import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSameThread, assertWritableThread } from '../src/chatThreadGuard.js';
import {
  sendDirectMessageCommand,
  sendTeamMessageCommand,
} from '../src/chatCommands.js';

test('same-thread guard no-ops when the client omitted expected id', () => {
  assert.equal(assertSameThread('', 'thread-a', 'conversation'), 'thread-a');
});

test('same-thread guard blocks a distractor conversation', () => {
  assert.throws(
    () => assertSameThread('thread-target', 'thread-distractor', 'conversation'),
    /open conversation/,
  );
});

test('writable guard blocks allowWrite false threads', () => {
  assert.throws(() => assertWritableThread(false, 'conversation'), /distractor conversation/);
});

test('sendDirectMessageCommand rejects expectedConversationId mismatch before repository write', async () => {
  const repository = {
    sendDirectMessage() {
      throw new Error('repository should not be called');
    },
  };
  await assert.rejects(
    () => sendDirectMessageCommand({
      actorUserId: 'user-1',
      conversationId: 'thread-distractor',
      expectedConversationId: 'thread-target',
      body: 'hello',
    }, repository),
    /open conversation/,
  );
});

test('sendTeamMessageCommand rejects expectedTeamId mismatch before repository write', async () => {
  const repository = {
    sendTeamMessage() {
      throw new Error('repository should not be called');
    },
  };
  await assert.rejects(
    () => sendTeamMessageCommand({
      actorUserId: 'user-1',
      teamId: 'team-b',
      expectedTeamId: 'team-a',
      body: 'hello',
    }, repository),
    /open team chat/,
  );
});
