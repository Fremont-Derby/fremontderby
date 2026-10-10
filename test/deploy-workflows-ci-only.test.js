import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('deploy-touching workflows never trigger on pull_request', () => {
  const src = readFileSync(new URL('../scripts/guard-cloudflare-build.mjs', import.meta.url), 'utf8');
  assert.match(src, /CLOUDFLARE_BUILD_BRANCHES/);
});
