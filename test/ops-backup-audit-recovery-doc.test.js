import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = join(root, 'docs/ops-backup-audit-recovery.md');

test('ops backup/audit/recovery runbook exists with required sections', () => {
  assert.equal(existsSync(doc), true);
  const text = readFileSync(doc, 'utf8');
  assert.match(text, /\/health\/environment/);
  assert.match(text, /audit_events/);
  assert.match(text, /Point-in-Time Recovery|PITR/);
  assert.match(text, /Bad deployment recovery/);
  assert.match(text, /Bad data change recovery/);
  assert.match(text, /hourly-live-probe/);
});
