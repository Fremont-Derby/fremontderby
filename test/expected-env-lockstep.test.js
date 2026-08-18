import test from 'node:test';
import assert from 'node:assert/strict';
import {
  expectedEnvironmentForHost,
  hostMatchesEnvironment,
} from '../src/hostEnvironment.js';

test('expectedEnvironmentForHost returns correct lane or production', () => {
  assert.equal(expectedEnvironmentForHost('fremontderby.com'), 'production');
  assert.equal(expectedEnvironmentForHost('www.fremontderby.com'), 'production');
  assert.equal(expectedEnvironmentForHost('jfl.fremontderby.com'), 'jfl');
  assert.equal(expectedEnvironmentForHost('dru.fremontderby.com'), 'dru');
  assert.equal(expectedEnvironmentForHost('gamma.fremontderby.com'), 'gamma');
});

test('expectedEnvironmentForHost returns null for unknown/local hosts', () => {
  assert.equal(expectedEnvironmentForHost('localhost'), null);
  assert.equal(expectedEnvironmentForHost('example.com'), null);
  assert.equal(expectedEnvironmentForHost(''), null);
});

test('hostMatchesEnvironment matches known hosts and returns null for unknown', () => {
  assert.equal(hostMatchesEnvironment('dru.fremontderby.com', 'dru'), true);
  assert.equal(hostMatchesEnvironment('dru.fremontderby.com', 'production'), false);
  assert.equal(hostMatchesEnvironment('localhost', 'production'), null);
});
