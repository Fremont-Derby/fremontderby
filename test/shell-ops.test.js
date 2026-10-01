import test from 'node:test';
import assert from 'node:assert/strict';
import { functionalSmoke, reportEvidence, sharedShell, spamLimit, twoCaptains } from '../src/shellOps.js';

test('a page keeps the shared shell', () => {
  assert.match(sharedShell({ name: 'Schedule' }).text, /shared shell/);
});

test('a human gate waits for functional data', () => {
  assert.equal(functionalSmoke({}).ready, false);
  assert.equal(functionalSmoke({ data: true }).ready, true);
});

test('two captains need different names', () => {
  assert.equal(twoCaptains({ name: 'Mina' }, { name: 'Mina' }), null);
  assert.equal(twoCaptains({ name: 'Mina' }, { name: 'Eli' }).sessions.length, 2);
});

test('five messages in a row are slowed', () => {
  assert.equal(spamLimit(5).allowed, false);
  assert.equal(spamLimit(1).allowed, true);
});

test('a report keeps its id and drops other message bodies', () => {
  assert.equal(reportEvidence({ id: 9 }).body, null);
  assert.equal(reportEvidence({}), null);
});
