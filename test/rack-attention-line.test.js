import test from 'node:test';
import assert from 'node:assert/strict';
import { rackAttentionLine } from '../src/rackAttentionLine.js';

test('one disputed rack needs attention', () => {
  assert.equal(rackAttentionLine(1), '1 rack needs attention.');
  assert.equal(rackAttentionLine(2), '2 racks need attention.');
  assert.equal(rackAttentionLine(0), '');
});
