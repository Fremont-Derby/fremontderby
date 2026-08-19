import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  REQUIRED_LABELS,
  validateLabelManifest,
  buildLabelSyncPlan,
} from '../scripts/collaboration-labels.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('REQUIRED_LABELS inventory includes agent/stage/priority/handoff core set', () => {
  for (const name of [
    'agent:dru',
    'agent:jfl',
    'stage:handoff',
    'stage:merge-ready',
    'priority:p0',
    'handoff:review',
    'blocked',
    'human-required',
  ]) {
    assert.ok(REQUIRED_LABELS.includes(name), name);
  }
});

test('collaboration-labels.json validates and includes area:infra + area:deployment', () => {
  const manifest = JSON.parse(readFileSync(join(root, '.github/collaboration-labels.json'), 'utf8'));
  const errors = validateLabelManifest(manifest);
  assert.deepEqual(errors, []);
  const names = new Set(manifest.labels.map((l) => l.name));
  assert.ok(names.has('area:infra'));
  assert.ok(names.has('area:deployment'));
  assert.ok(names.has('area:platform'));
  for (const required of REQUIRED_LABELS) {
    assert.ok(names.has(required), `missing required ${required}`);
  }
});

test('validateLabelManifest rejects bad version, colors, and missing required labels', () => {
  assert.ok(validateLabelManifest({ version: 2, labels: [] }).length > 0);
  assert.ok(
    validateLabelManifest({
      version: 1,
      labels: [{ name: 'Agent:X', color: 'GGGGGG', description: '' }],
    }).length > 0,
  );
});

test('buildLabelSyncPlan creates and updates labels as needed', () => {
  const desired = [
    { name: 'agent:dru', color: '8250df', description: 'DRU owns' },
    { name: 'priority:p0', color: 'b60205', description: 'blocker' },
  ];
  const plan = buildLabelSyncPlan(desired, [
    { name: 'agent:dru', color: '000000', description: 'old' },
  ]);
  assert.equal(plan.create.length, 1);
  assert.equal(plan.create[0].name, 'priority:p0');
  assert.equal(plan.update.length, 1);
  assert.equal(plan.update[0].name, 'agent:dru');
});
