import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedEnvironmentForHost, hostMatchesEnvironment } from '../src/hostEnvironment.js';

test('expectedEnvironmentForHost ignores port on known hosts', () => {
  assert.equal(expectedEnvironmentForHost('jfl.fremontderby.com:443'), 'jfl');
  assert.equal(expectedEnvironmentForHost('DRU.fremontderby.com:80'), 'dru');
  assert.equal(expectedEnvironmentForHost('www.fremontderby.com:443'), 'production');
});

test('hostMatchesEnvironment works with port-bearing hosts', () => {
  assert.equal(hostMatchesEnvironment('gamma.fremontderby.com:443', 'gamma'), true);
  assert.equal(hostMatchesEnvironment('gamma.fremontderby.com:443', 'production'), false);
});
