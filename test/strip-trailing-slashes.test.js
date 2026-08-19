import assert from 'node:assert/strict';
import test from 'node:test';
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';

test('stripTrailingSlashes removes only trailing slashes', () => {
  assert.equal(stripTrailingSlashes('/api/teams/'), '/api/teams');
  assert.equal(stripTrailingSlashes('/api/teams///'), '/api/teams');
  assert.equal(stripTrailingSlashes('path'), 'path');
  assert.equal(stripTrailingSlashes('path/'), 'path');
});

test('stripTrailingSlashes handles empty and non-string', () => {
  assert.equal(stripTrailingSlashes(''), '');
  assert.equal(stripTrailingSlashes('/'), '');
  assert.equal(stripTrailingSlashes('///'), '');
  assert.equal(stripTrailingSlashes(null), '');
  assert.equal(stripTrailingSlashes(undefined), '');
  assert.equal(stripTrailingSlashes(42), '42');
});

test('stripTrailingSlashes does not alter internal or leading-only structure beyond trailing', () => {
  assert.equal(stripTrailingSlashes('/api/teams/ready-checks'), '/api/teams/ready-checks');
  assert.equal(stripTrailingSlashes('//leading'), '//leading');
  assert.equal(stripTrailingSlashes('a/b/c/'), 'a/b/c');
});
