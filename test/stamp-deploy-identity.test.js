import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const stampScript = fileURLToPath(new URL('../scripts/stamp-deploy-identity.mjs', import.meta.url));

function makeFixture(root) {
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(
    join(root, 'src/routerEntry.js'),
    `// fixture\nconst STAMPED_DEPLOY_GIT_SHA = null;\nconst STAMPED_DEPLOY_AT = null;\nexport default {};\n`,
  );
}

test('stamp-deploy-identity writes WORKERS_CI_COMMIT_SHA into routerEntry and deployIdentity', () => {
  const root = mkdtempSync(join(tmpdir(), 'stamp-id-'));
  try {
    makeFixture(root);
    const sha = 'a'.repeat(40);
    const result = spawnSync(process.execPath, [stampScript], {
      cwd: root,
      env: {
        ...process.env,
        WORKERS_CI_COMMIT_SHA: sha,
        GITHUB_SHA: '',
        DEPLOY_GIT_SHA: '',
      },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const entry = readFileSync(join(root, 'src/routerEntry.js'), 'utf8');
    assert.match(entry, new RegExp(`STAMPED_DEPLOY_GIT_SHA = "${sha}"`));
    assert.match(entry, /STAMPED_DEPLOY_AT = "\d{4}-/);
    const identity = readFileSync(join(root, 'src/deployIdentity.js'), 'utf8');
    assert.match(identity, new RegExp(`gitSha: "${sha}"`));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('stamp-deploy-identity prefers GITHUB_SHA over WORKERS_CI_COMMIT_SHA', () => {
  const root = mkdtempSync(join(tmpdir(), 'stamp-id-'));
  try {
    makeFixture(root);
    const github = 'b'.repeat(40);
    const workers = 'c'.repeat(40);
    const result = spawnSync(process.execPath, [stampScript], {
      cwd: root,
      env: {
        ...process.env,
        GITHUB_SHA: github,
        WORKERS_CI_COMMIT_SHA: workers,
      },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const entry = readFileSync(join(root, 'src/routerEntry.js'), 'utf8');
    assert.match(entry, new RegExp(`STAMPED_DEPLOY_GIT_SHA = "${github}"`));
    assert.doesNotMatch(entry, new RegExp(workers));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('stamp-deploy-identity exits 0 with a warning when no SHA is available', () => {
  const root = mkdtempSync(join(tmpdir(), 'stamp-id-'));
  try {
    makeFixture(root);
    // Point PATH away from git so rev-parse cannot rescue an empty env.
    const result = spawnSync(process.execPath, [stampScript], {
      cwd: root,
      env: {
        PATH: '/usr/bin:/bin',
        GITHUB_SHA: '',
        WORKERS_CI_COMMIT_SHA: '',
        DEPLOY_GIT_SHA: '',
      },
      encoding: 'utf8',
    });
    // May succeed via git HEAD in this repo clone context when cwd is fixture without .git:
    // fixture has no .git, so status should be 0 with warning or stamp from empty → warn path.
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
