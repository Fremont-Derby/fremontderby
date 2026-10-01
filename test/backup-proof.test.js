import test from 'node:test';
import assert from 'node:assert/strict';
import { proveBackup } from '../src/backupProof.js';

test('a restore is proven only off production, with a named backup that served', () => {
  assert.equal(proveBackup({ lane: 'prod', backup: 'night', served: true }).ok, false);
  assert.equal(proveBackup({ lane: 'dru', backup: '', served: true }).ok, false);
  assert.equal(proveBackup({ lane: 'dru', backup: 'night', served: false }).ok, false);
  assert.equal(proveBackup({ lane: 'dru', backup: 'night', served: true }).ok, true);
});
