import test from 'node:test';
import assert from 'node:assert/strict';
import { MESSAGE_THREAD_MISSION, buildMessageThreadFixture } from '../src/qaMessageThreadContract.js';

test('message-thread mission requires the correct conversation', () => {
  assert.equal(MESSAGE_THREAD_MISSION.missionId, 'player.send-correct-message');
  assert.ok(MESSAGE_THREAD_MISSION.productRoutes.includes('/messages'));
  assert.match(MESSAGE_THREAD_MISSION.action, /distractor thread/i);
});

test('message-thread fixture has one writable unread target and two distractors', () => {
  const fixture = buildMessageThreadFixture('msg-seed-1');
  assert.equal(fixture.target.unread, true);
  assert.equal(fixture.target.allowWrite, true);
  assert.equal(fixture.distractors.length, 2);
  assert.equal(fixture.distractors.every((row) => row.allowWrite === false), true);
  assert.notEqual(fixture.target.threadId, fixture.distractors[0].threadId);
  assert.notEqual(fixture.target.preview, fixture.distractors[0].preview);
  const scopes = new Set([fixture.target.scope, ...fixture.distractors.map((row) => row.scope)]);
  assert.equal(scopes.size, 3);
  assert.equal(fixture.semantic.reply_must_not_mutate_wrong_thread, true);
});

test('message-thread fixture is deterministic for exact replay', () => {
  assert.deepEqual(buildMessageThreadFixture('repeat-me'), buildMessageThreadFixture('repeat-me'));
  assert.notDeepEqual(buildMessageThreadFixture('repeat-me'), buildMessageThreadFixture('new-seed'));
});
