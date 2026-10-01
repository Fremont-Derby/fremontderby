import test from 'node:test';
import assert from 'node:assert/strict';
import { assignRoster, auditHistory, coherenceCheck, moderationQueue, rulesGuide } from '../src/reviewOps.js';

test('audit history keeps actor and action', () => {
  assert.deepEqual(auditHistory([{ actor: 'Mina', action: 'closed the season' }, { action: 'no actor' }]), ['Mina closed the season']);
});

test('moderation lists only flagged messages', () => {
  assert.equal(moderationQueue([{ id: 1, flagged: true }, { id: 2, flagged: false }]).length, 1);
});

test('a player is not assigned twice', () => {
  assert.equal(assignRoster({ name: 'Owls', players: ['Eli'] }, { name: 'Eli' }).added, false);
  assert.equal(assignRoster({ name: 'Owls', players: [] }, { name: 'Jules' }).added, true);
});

test('the rules guide keeps five titles', () => {
  assert.equal(rulesGuide([{ title: 'One captain' }, { title: 'No trades' }]).length, 2);
});

test('coherence fails a page with no heading', () => {
  assert.equal(coherenceCheck([{ name: 'Schedule' }]).ok, false);
  assert.equal(coherenceCheck([{ name: 'Schedule', heading: 'Schedule' }]).ok, true);
});
