import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('do-work:check chains canary:contract then canary', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['do-work:check'], 'npm run canary:contract && npm run canary');
  assert.match(pkg.scripts['canary:contract'], /public-surface-contract\.test\.js/);
  assert.match(pkg.scripts['canary:contract'], /assert-production-dns\.test\.js/);
});
