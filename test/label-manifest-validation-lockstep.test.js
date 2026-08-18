import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLabelManifest, REQUIRED_LABELS } from '../scripts/collaboration-labels.mjs';

test('validateLabelManifest rejects missing version', () => {
  const errors = validateLabelManifest({ labels: [] });
  assert.ok(errors.some((e) => /version 1/.test(e)));
});

test('validateLabelManifest requires all REQUIRED_LABELS', () => {
  const labels = REQUIRED_LABELS.map((name) => ({
    name,
    color: 'abcdef',
    description: 'ok',
  }));
  labels.push({ name: 'area:infra', color: '123456', description: 'infra' });
  const errors = validateLabelManifest({ version: 1, labels });
  assert.deepEqual(errors, []);
});

test('validateLabelManifest requires at least one area:*', () => {
  const labels = REQUIRED_LABELS.map((name) => ({
    name,
    color: 'abcdef',
    description: 'ok',
  }));
  const errors = validateLabelManifest({ version: 1, labels });
  assert.ok(errors.some((e) => /area:\*/.test(e)));
});
