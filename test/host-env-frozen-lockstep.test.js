import test from 'node:test';
import assert from 'node:assert/strict';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('HOST_ENVIRONMENT_EXPECTATIONS is frozen', () => {
  assert.equal(Object.isFrozen(HOST_ENVIRONMENT_EXPECTATIONS), true);
});

test('HOST_ENVIRONMENT_EXPECTATIONS rejects mutation', () => {
  assert.throws(() => {
    HOST_ENVIRONMENT_EXPECTATIONS['test.example.com'] = 'production';
  }, TypeError);
});
