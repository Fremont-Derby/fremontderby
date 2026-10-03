import test from 'node:test';
import assert from 'node:assert/strict';
import { missingScoreDateLine } from '../src/missingScoreDate.js';

test('a score date that is not on the list says so', () => {
  assert.equal(missingScoreDateLine(), 'That score date is not on the list.');
});
