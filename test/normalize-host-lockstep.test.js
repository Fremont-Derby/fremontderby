import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRequestHost } from '../src/hostEnvironment.js';

test('normalizeRequestHost lowercases and strips port', () => {
  assert.equal(normalizeRequestHost('JFL.FremontDerby.com:443'), 'jfl.fremontderby.com');
  assert.equal(normalizeRequestHost('www.fremontderby.com:80'), 'www.fremontderby.com');
});

test('normalizeRequestHost trims whitespace and handles empty', () => {
  assert.equal(normalizeRequestHost('  dru.fremontderby.com  '), 'dru.fremontderby.com');
  assert.equal(normalizeRequestHost(''), '');
  assert.equal(normalizeRequestHost(null), '');
  assert.equal(normalizeRequestHost(undefined), '');
});
