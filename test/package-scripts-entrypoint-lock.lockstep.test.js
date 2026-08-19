import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

test('package scripts lock a11y/build/check/dev/do-work entrypoints', () => {
  assert.equal(pkg.scripts.a11y, 'node scripts/pa11y-rendered.mjs');
  assert.ok(String(pkg.scripts.build).includes('wrangler deploy --dry-run'));
  assert.equal(pkg.scripts.check, 'node scripts/check-js-syntax.mjs');
  assert.equal(pkg.scripts['check:epic-status'], 'node scripts/check-parent-epic-drift.mjs');
  assert.equal(pkg.scripts.dev, 'npx wrangler dev');
  assert.equal(pkg.scripts['do-work:check'], 'npm run canary:contract && npm run canary');
});
