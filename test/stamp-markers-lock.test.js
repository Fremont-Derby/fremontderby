import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');

test('routerEntry declares STAMPED_DEPLOY markers defaulting to null', () => {
  assert.match(source, /const STAMPED_DEPLOY_GIT_SHA = null;/);
  assert.match(source, /const STAMPED_DEPLOY_AT = null;/);
});

test('routerEntry health path considers stamped deploy SHA', () => {
  assert.match(source, /STAMPED_DEPLOY_GIT_SHA/);
  assert.match(source, /fromStamp/);
});

test('stamp-deploy-identity targets the same marker strings', () => {
  const stamp = readFileSync(new URL('../scripts/stamp-deploy-identity.mjs', import.meta.url), 'utf8');
  assert.match(stamp, /STAMPED_DEPLOY_GIT_SHA/);
  assert.match(stamp, /STAMPED_DEPLOY_AT/);
  assert.match(stamp, /src\/routerEntry\.js/);
});
