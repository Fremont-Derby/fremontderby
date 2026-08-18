import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('lint scripts map to dedicated lint modules', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.lint, 'node scripts/lint.mjs');
  assert.equal(pkg.scripts['lint:templates'], 'node scripts/lint-template-regex.mjs');
  assert.equal(pkg.scripts['lint:inner-html'], 'node scripts/lint-inner-html.mjs');
});
