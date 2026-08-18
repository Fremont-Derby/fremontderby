import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('prebuild guards cloudflare builds and labels:check validates manifest', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.prebuild, 'node scripts/guard-cloudflare-build.mjs');
  assert.equal(pkg.scripts['labels:check'], 'node scripts/collaboration-labels.mjs --check');
  assert.equal(pkg.scripts['test:floor'], 'node scripts/count-tests.mjs');
});
