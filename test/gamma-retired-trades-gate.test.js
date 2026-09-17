import assert from 'node:assert/strict';
import test from 'node:test';
import { isRetiredTradePath } from '../src/retiredTradesGate.js';

test('gamma retires the trades page and trade APIs', () => {
  assert.equal(isRetiredTradePath('/trades'), true);
  assert.equal(isRetiredTradePath('/api/me/trades'), true);
  assert.equal(isRetiredTradePath('/api/teams/abc/trades'), true);
  assert.equal(isRetiredTradePath('/teams'), false);
  assert.equal(isRetiredTradePath('/schedule'), false);
});
