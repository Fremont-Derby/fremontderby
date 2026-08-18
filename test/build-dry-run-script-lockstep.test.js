import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('build uses wrangler deploy dry-run to dist', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.match(pkg.scripts.build, /wrangler deploy --dry-run/);
  assert.match(pkg.scripts.build, /--outdir dist/);
});
