import test from 'node:test';
import assert from 'node:assert/strict';
import { recentSurveyLine, adminSurveyLine } from '../src/surveySummary.js';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';

test('an admin survey summary names the recent result', () => {
  assert.equal(recentSurveyLine([]), 'No recent survey results.');
  assert.equal(adminSurveyLine([{ mission: 'find my next match', result: 'passed' }]), 'Admin survey: find my next match: passed.');
  assert.match(renderAdminOperationsPage(), /Admin survey: find my next match: passed/);
});
