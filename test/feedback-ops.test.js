import test from 'node:test';
import assert from 'node:assert/strict';
import { failedGate, incidentStep, registrationExpiry, testerFeedback, visiblePath } from '../src/feedbackOps.js';

test('tester feedback needs a lane and a sha', () => {
  assert.match(testerFeedback({ text: 'stuck', lane: 'dru', sha: 'abc' }).text, /abc/);
  assert.equal(testerFeedback({ text: 'stuck' }), null);
});

test('a workflow needs a visible label and a path', () => {
  assert.match(visiblePath({ label: 'Schedule', href: '/schedule' }).text, /not a hidden/);
  assert.equal(visiblePath({ label: 'Schedule' }), null);
});

test('a failed gate names the test', () => {
  assert.match(failedGate({ gate: 'score', test: 'rack-win' }).text, /rack-win/);
});

test('a score outage has a hand-entry step', () => {
  assert.match(incidentStep('score-down').text, /hand/);
});

test('an expired registration leaves the public read', () => {
  assert.equal(registrationExpiry({ expires: true }).active, false);
});
