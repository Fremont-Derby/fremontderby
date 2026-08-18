import test from 'node:test';
import assert from 'node:assert/strict';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('HOST_ENVIRONMENT_EXPECTATIONS keys are the five public Fremont Derby hosts', () => {
  const keys = Object.keys(HOST_ENVIRONMENT_EXPECTATIONS).sort();
  assert.deepEqual(keys, [
    'dru.fremontderby.com',
    'fremontderby.com',
    'gamma.fremontderby.com',
    'jfl.fremontderby.com',
    'www.fremontderby.com',
  ]);
});

test('HOST_ENVIRONMENT_EXPECTATIONS maps apex and www to production', () => {
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['fremontderby.com'], 'production');
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['www.fremontderby.com'], 'production');
});

test('HOST_ENVIRONMENT_EXPECTATIONS maps lane hosts to their environments', () => {
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['jfl.fremontderby.com'], 'jfl');
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['dru.fremontderby.com'], 'dru');
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['gamma.fremontderby.com'], 'gamma');
});
