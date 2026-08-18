import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLabelManifest, REQUIRED_LABELS } from '../scripts/collaboration-labels.mjs';

test('validateLabelManifest rejects missing version or labels', () => {
  assert.ok(validateLabelManifest(null).length > 0);
  assert.ok(validateLabelManifest({ version: 2, labels: [] }).length > 0);
});

test('validateLabelManifest accepts a minimal valid required set with area', () => {
  const labels = REQUIRED_LABELS.map((name) => ({
    name,
    color: 'abcdef',
    description: name,
  }));
  labels.push({ name: 'area:platform', color: '123456', description: 'platform' });
  assert.deepEqual(validateLabelManifest({ version: 1, labels }), []);
});
