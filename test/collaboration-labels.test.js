import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  REQUIRED_LABELS,
  buildLabelSyncPlan,
  validateLabelManifest,
} from '../scripts/collaboration-labels.mjs';

const manifest = JSON.parse(await readFile(new URL('../.github/collaboration-labels.json', import.meta.url), 'utf8'));

test('collaboration label manifest is valid and complete', () => {
  assert.deepEqual(validateLabelManifest(manifest), []);
  const names = new Set(manifest.labels.map((label) => label.name));
  for (const name of REQUIRED_LABELS) assert.equal(names.has(name), true, name);
});

test('manifest validation rejects duplicates and malformed colors', () => {
  const invalid = structuredClone(manifest);
  invalid.labels.push({ ...invalid.labels[0], color: '#ffffff' });
  const errors = validateLabelManifest(invalid);
  assert.equal(errors.some((error) => error.includes('Duplicate label name')), true);
  assert.equal(errors.some((error) => error.includes('six lowercase hexadecimal')), true);
});

test('sync plan creates missing labels and updates drift without deleting labels', () => {
  const desired = manifest.labels.slice(0, 2);
  const existing = [
    { name: desired[0].name, color: 'ffffff', description: 'stale' },
    { name: 'unrelated', color: '000000', description: 'preserve me' },
  ];
  const plan = buildLabelSyncPlan(desired, existing);
  assert.deepEqual(plan.create, [desired[1]]);
  assert.equal(plan.update.length, 1);
  assert.equal(plan.update[0].name, desired[0].name);
  assert.equal('delete' in plan, false);
});
