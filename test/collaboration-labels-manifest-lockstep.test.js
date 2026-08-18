import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REQUIRED_LABELS, validateLabelManifest } from '../scripts/collaboration-labels.mjs';

test('collaboration-labels.json is version 1 and validates', () => {
  const manifest = JSON.parse(readFileSync('.github/collaboration-labels.json', 'utf8'));
  assert.equal(manifest.version, 1);
  assert.deepEqual(validateLabelManifest(manifest), []);
});

test('collaboration-labels.json includes all REQUIRED_LABELS', () => {
  const manifest = JSON.parse(readFileSync('.github/collaboration-labels.json', 'utf8'));
  const names = new Set(manifest.labels.map((l) => l.name));
  for (const required of REQUIRED_LABELS) {
    assert.ok(names.has(required), required);
  }
});
