import test from 'node:test';
import assert from 'node:assert/strict';
import { fargoIdLooksValid } from '../src/fargoReportsHttp.js';

test('a Fargo id must be digits', () => {
  assert.equal(fargoIdLooksValid('555123'), true);
  assert.equal(fargoIdLooksValid('abc'), false);
  assert.equal(fargoIdLooksValid(''), false);
});
