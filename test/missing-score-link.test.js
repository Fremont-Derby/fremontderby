import test from 'node:test';
import assert from 'node:assert/strict';
import { missingScoreLinkLine } from '../src/missingScoreLink.js';

test('a score link that is not on the list says so', () => {
  assert.equal(missingScoreLinkLine(), 'That score link is not on the list.');
});
