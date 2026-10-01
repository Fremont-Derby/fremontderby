import test from 'node:test';
import assert from 'node:assert/strict';
import { secretInventory } from '../src/secretNames.js';

test('inventory names the required secrets and never returns a value', () => {
  const result = secretInventory(['SESSION_SECRET']);
  assert.deepEqual(result.missing, ['GITHUB_TOKEN']);
  assert.equal(JSON.stringify(result).includes('value'), false);
});
