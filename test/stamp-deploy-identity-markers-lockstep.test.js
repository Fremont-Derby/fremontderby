import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('stamp-deploy-identity and routerEntry share STAMPED markers', () => {
  const stamp = readFileSync('scripts/stamp-deploy-identity.mjs', 'utf8');
  const entry = readFileSync('src/routerEntry.js', 'utf8');
  assert.match(stamp, /STAMPED_DEPLOY_GIT_SHA/);
  assert.match(stamp, /STAMPED_DEPLOY_AT/);
  assert.match(stamp, /src\/deployIdentity\.js/);
  assert.match(stamp, /rmSync\('\.wrangler'/);
  assert.match(entry, /const STAMPED_DEPLOY_GIT_SHA/);
  assert.match(entry, /const STAMPED_DEPLOY_AT/);
});
