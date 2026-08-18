import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('check-parent-epic-drift audits parents 1-4', () => {
  const source = readFileSync('scripts/check-parent-epic-drift.mjs', 'utf8');
  assert.match(source, /const PARENTS = \[1, 2, 3, 4\]/);
});

test('package check:epic-status maps to check-parent-epic-drift', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['check:epic-status'], 'node scripts/check-parent-epic-drift.mjs');
  assert.equal(pkg.scripts['labels:check'], 'node scripts/collaboration-labels.mjs --check');
});
