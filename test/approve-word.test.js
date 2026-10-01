import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewDecisionWord } from '../src/index.js';

test('team review maps the approve word the form sends', () => {
  assert.equal(reviewDecisionWord({ decision: 'approve' }), 'approve');
  assert.equal(reviewDecisionWord({ decision: 'approved' }), 'approve');
  assert.equal(reviewDecisionWord({ decision: 'defer' }), 'defer');
  assert.equal(reviewDecisionWord({ decision: 'reject' }), 'reject');
  assert.equal(reviewDecisionWord({ decision: 'declined' }), 'reject');
});

test('team review does not call get on a plain object', () => {
  assert.doesNotThrow(() => reviewDecisionWord({ decision: 'approve' }));
  assert.notEqual(reviewDecisionWord({ decision: 'approve' }), undefined);
});

