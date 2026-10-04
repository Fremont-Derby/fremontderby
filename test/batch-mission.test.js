import test from 'node:test';
import assert from 'node:assert/strict';
import { batchMissionLine, surveyPromiseLine, sixthMissionLine } from '../src/batchMission.js';
import { renderBatchMissionPage } from '../src/batchMissionPage.js';

test('a six-mission batch and the survey promise are named', () => {
  assert.equal(batchMissionLine({ count: 6 }), 'Batch: 6 missions.');
  assert.equal(surveyPromiseLine({ after: 'the sixth mission' }), 'Survey after the sixth mission.');
  assert.equal(sixthMissionLine({ name: 'find my team' }), 'Sixth mission: find my team.');
  const html = renderBatchMissionPage();
  assert.match(html, /Batch: 6 missions/);
  assert.match(html, /Survey after the sixth mission/);
});
