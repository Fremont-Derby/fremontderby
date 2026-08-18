import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRequestHost,
  expectedEnvironmentForHost,
  hostMatchesEnvironment,
} from '../src/hostEnvironment.js';

test('normalizeRequestHost lowercases and strips port', () => {
  assert.equal(normalizeRequestHost('DRU.FremontDerby.com:443'), 'dru.fremontderby.com');
  assert.equal(normalizeRequestHost(''), '');
});

test('hostMatchesEnvironment returns null for unknown hosts and bool for known', () => {
  assert.equal(expectedEnvironmentForHost('dru.fremontderby.com'), 'dru');
  assert.equal(hostMatchesEnvironment('dru.fremontderby.com', 'dru'), true);
  assert.equal(hostMatchesEnvironment('dru.fremontderby.com', 'jfl'), false);
  assert.equal(hostMatchesEnvironment('localhost', 'production'), null);
});
