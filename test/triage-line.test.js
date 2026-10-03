import test from 'node:test';
import assert from 'node:assert/strict';
import { triageLabelLine, defectRecommendationLine } from '../src/triageLine.js';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';

test('a triage label and a defect recommendation are named', () => {
  assert.equal(triageLabelLine({ name: 'score', issue: 2266 }), 'Triage score for #2266.');
  assert.equal(defectRecommendationLine({ name: 'schedule' }), 'Recommend: check schedule.');
  const html = renderAdminOperationsPage();
  assert.match(html, /Triage score for #2266/);
  assert.match(html, /Recommend: check schedule/);
});
