import test from 'node:test';
import assert from 'node:assert/strict';
import { finishedScheduleCard } from '../src/scheduleCard.js';

test('a finished schedule card shows the score and hides the extra actions', () => {
  const card = finishedScheduleCard({ status: 'finalized', teamScore: '2-1', playerMatchups: [{ playerAName: 'Ada', racksA: 5, playerBName: 'Bea', racksB: 3 }] });
  assert.equal(card.scoreLine, 'Team score 2-1');
  assert.equal(card.matchupLines[0], 'Ada 5 – Bea 3');
  assert.deepEqual(card.actions, ['Lineup']);
  assert.equal(finishedScheduleCard({ status: 'scheduled' }).actions.includes('Score'), true);
});
