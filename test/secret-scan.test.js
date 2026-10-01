import test from 'node:test';
import assert from 'node:assert/strict';
import { scanForSecrets } from '../src/secretScan.js';

test('token-shaped text blocks a save and ordinary notes pass', () => {
  assert.equal(scanForSecrets('roster is set').ok, true);
  assert.equal(scanForSecrets('github_pat_exampletoken').ok, false);
});
