import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnosticBundle, humanFail, mobileShot, reviewAfterFour, reverseGate } from '../src/gateOps.js';

test('a gate can be turned off', () => {
  assert.equal(reverseGate({ name: 'schedule', on: true }).on, false);
  assert.equal(reverseGate({}), null);
});

test('a human fail keeps the gate open', () => {
  assert.equal(humanFail({ name: 'lineup' }).open, true);
});

test('the review waits for four findings', () => {
  assert.equal(reviewAfterFour([1, 2, 3, 4]).count, 4);
  assert.equal(reviewAfterFour([1]).text, 'Fewer than four findings.');
});

test('a mobile shot is 390 pixels wide', () => {
  assert.equal(mobileShot({ name: 'schedule' }).width, 390);
});

test('a diagnostic bundle needs a lane and a sha', () => {
  assert.match(diagnosticBundle({ lane: 'dru', sha: 'abc', note: 'scroll' }).text, /abc/);
  assert.equal(diagnosticBundle({ lane: 'dru' }), null);
});
