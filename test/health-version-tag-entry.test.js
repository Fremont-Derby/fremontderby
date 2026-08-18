import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function withRestoredRouterEntry(fn) {
  const entryUrl = new URL('../src/routerEntry.js', import.meta.url);
  const original = readFileSync(entryUrl, 'utf8');
  try {
    return fn(entryUrl);
  } finally {
    writeFileSync(entryUrl, original);
  }
}

function runStamp(envOverrides) {
  // Strip parent git SHA env so preference tests are deterministic.
  const base = { ...process.env };
  delete base.GITHUB_SHA;
  delete base.WORKERS_CI_COMMIT_SHA;
  delete base.DEPLOY_GIT_SHA;
  return spawnSync(process.execPath, ['scripts/stamp-deploy-identity.mjs'], {
    env: { ...base, ...envOverrides },
    encoding: 'utf8',
  });
}

test('routerEntry has stamp markers', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(src, /STAMPED_DEPLOY_GIT_SHA/);
  assert.match(src, /stamped_source/);
});

test('stamp-deploy-identity rewrites routerEntry constant from GITHUB_SHA', () => {
  withRestoredRouterEntry((entryUrl) => {
    const sha = 'deadbeefcafebabe0123456789abcdef01234567';
    const r = runStamp({ GITHUB_SHA: sha });
    assert.equal(r.status, 0, r.stderr || r.stdout);
    assert.match(readFileSync(entryUrl, 'utf8'), new RegExp(sha));
  });
});

test('stamp prefers GITHUB_SHA over WORKERS_CI_COMMIT_SHA', () => {
  withRestoredRouterEntry((entryUrl) => {
    const github = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const workers = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const r = runStamp({ GITHUB_SHA: github, WORKERS_CI_COMMIT_SHA: workers });
    assert.equal(r.status, 0, r.stderr || r.stdout);
    const stamped = readFileSync(entryUrl, 'utf8');
    assert.match(stamped, new RegExp(github));
    assert.doesNotMatch(stamped, new RegExp(workers));
  });
});

test('stamp uses WORKERS_CI_COMMIT_SHA when GITHUB_SHA is absent', () => {
  withRestoredRouterEntry((entryUrl) => {
    const workers = 'cccccccccccccccccccccccccccccccccccccccc';
    const r = runStamp({ WORKERS_CI_COMMIT_SHA: workers });
    assert.equal(r.status, 0, r.stderr || r.stdout);
    assert.match(readFileSync(entryUrl, 'utf8'), new RegExp(workers));
  });
});

test('stamp uses DEPLOY_GIT_SHA when higher-priority SHAs are absent', () => {
  withRestoredRouterEntry((entryUrl) => {
    const deploy = 'dddddddddddddddddddddddddddddddddddddddd';
    const r = runStamp({ DEPLOY_GIT_SHA: deploy });
    assert.equal(r.status, 0, r.stderr || r.stdout);
    assert.match(readFileSync(entryUrl, 'utf8'), new RegExp(deploy));
  });
});
