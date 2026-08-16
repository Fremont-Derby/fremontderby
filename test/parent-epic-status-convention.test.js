import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('parent epic status convention is documented', () => {
  const doc = readFileSync(join(root, 'docs/parent-epic-status-convention.md'), 'utf8');
  assert.match(doc, /#247/);
  assert.match(doc, /historical roll-ups/i);
  assert.match(doc, /check-parent-epic-drift/);
  assert.match(doc, /#1–#4|#1-#4|#1/);
});

test('drift check script exists and names parents 1-4', () => {
  const script = readFileSync(join(root, 'scripts/check-parent-epic-drift.mjs'), 'utf8');
  assert.match(script, /PARENTS = \[1, 2, 3, 4\]/);
  assert.match(script, /process\.exit\(1\)/);
  assert.equal(existsSync(join(root, 'docs/parent-epic-status-convention.md')), true);
});

test('package.json exposes check:epic-status', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['check:epic-status'], 'node scripts/check-parent-epic-drift.mjs');
});
