import test from 'node:test';
import assert from 'node:assert/strict';
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';

test('stripTrailingSlashes removes one or more trailing slashes', () => {
  assert.equal(stripTrailingSlashes('https://example.com/'), 'https://example.com');
  assert.equal(stripTrailingSlashes('https://example.com///'), 'https://example.com');
  assert.equal(stripTrailingSlashes('https://example.com'), 'https://example.com');
});

test('stripTrailingSlashes handles empty and nullish', () => {
  assert.equal(stripTrailingSlashes(''), '');
  assert.equal(stripTrailingSlashes(null), '');
  assert.equal(stripTrailingSlashes(undefined), '');
});
