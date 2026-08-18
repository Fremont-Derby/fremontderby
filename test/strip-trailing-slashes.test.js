import test from 'node:test';
import assert from 'node:assert/strict';
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';

test('stripTrailingSlashes leaves strings without trailing slash unchanged', () => {
  assert.equal(stripTrailingSlashes('https://example.supabase.co'), 'https://example.supabase.co');
  assert.equal(stripTrailingSlashes(''), '');
  assert.equal(stripTrailingSlashes(null), '');
  assert.equal(stripTrailingSlashes(undefined), '');
});

test('stripTrailingSlashes removes one or more trailing slashes', () => {
  assert.equal(stripTrailingSlashes('https://example.supabase.co/'), 'https://example.supabase.co');
  assert.equal(stripTrailingSlashes('https://example.supabase.co///'), 'https://example.supabase.co');
});
