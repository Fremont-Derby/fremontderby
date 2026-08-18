import test from 'node:test';
import assert from 'node:assert/strict';
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';

test('stripTrailingSlashes removes trailing slashes only', () => {
  assert.equal(stripTrailingSlashes('https://x.com/'), 'https://x.com');
  assert.equal(stripTrailingSlashes('https://x.com///'), 'https://x.com');
  assert.equal(stripTrailingSlashes('https://x.com/path'), 'https://x.com/path');
  assert.equal(stripTrailingSlashes(null), '');
});
