import test from 'node:test';
import assert from 'node:assert/strict';
import { draftCanPublish } from '../src/draftPublish.js';

test('a draft night can be put back before publish', () => {
  assert.equal(draftCanPublish('draft'), true);
  assert.equal(draftCanPublish('active'), false);
});
