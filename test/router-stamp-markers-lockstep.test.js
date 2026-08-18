import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('routerEntry declares STAMPED_DEPLOY_GIT_SHA and STAMPED_DEPLOY_AT markers', () => {
  const source = readFileSync('src/routerEntry.js', 'utf8');
  assert.match(source, /const STAMPED_DEPLOY_GIT_SHA = /);
  assert.match(source, /const STAMPED_DEPLOY_AT = /);
});

test('routerEntry versionTag priority includes stamp source', () => {
  const source = readFileSync('src/routerEntry.js', 'utf8');
  assert.match(source, /fromStamp/);
  assert.match(source, /versionTagSource = 'stamped_source'/);
  assert.match(source, /fromMeta \|\| fromEnv \|\| fromStamp \|\| fromId/);
});
