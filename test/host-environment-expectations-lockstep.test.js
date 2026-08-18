import test from 'node:test';
import assert from 'node:assert/strict';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('HOST_ENVIRONMENT_EXPECTATIONS covers apex www and permanent lanes', () => {
  assert.equal(Object.isFrozen(HOST_ENVIRONMENT_EXPECTATIONS), true);
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['fremontderby.com'], 'production');
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['www.fremontderby.com'], 'production');
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['jfl.fremontderby.com'], 'jfl');
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['dru.fremontderby.com'], 'dru');
  assert.equal(HOST_ENVIRONMENT_EXPECTATIONS['gamma.fremontderby.com'], 'gamma');
});
