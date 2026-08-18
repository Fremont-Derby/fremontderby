
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

test('routerEntry has stamp markers', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(src, /STAMPED_DEPLOY_GIT_SHA/);
  assert.match(src, /stamped_source/);
});

test('stamp-deploy-identity rewrites routerEntry constant', () => {
  const entryUrl = new URL('../src/routerEntry.js', import.meta.url);
  const original = readFileSync(entryUrl, 'utf8');
  const r = spawnSync(process.execPath, ['scripts/stamp-deploy-identity.mjs'], {
    env: { ...process.env, GITHUB_SHA: 'deadbeefcafebabe0123456789abcdef01234567' },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const stamped = readFileSync(entryUrl, 'utf8');
  assert.match(stamped, /deadbeefcafebabe0123456789abcdef01234567/);
  writeFileSync(entryUrl, original);
});
