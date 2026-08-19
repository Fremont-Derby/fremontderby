import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidGitSha,
  resolveDeployGitSha,
  applyStampToRouterSource,
  buildDeployIdentityModule,
  runStampDeployIdentity,
} from '../scripts/stamp-deploy-identity.mjs';

const FULL = 'a'.repeat(40);
const SHORT = 'abcdef1';

test('isValidGitSha accepts 7–40 hex only', () => {
  assert.equal(isValidGitSha(FULL), true);
  assert.equal(isValidGitSha(SHORT), true);
  assert.equal(isValidGitSha('abc'), false);
  assert.equal(isValidGitSha('not-a-sha'), false);
  assert.equal(isValidGitSha(''), false);
});

test('resolveDeployGitSha prefers GITHUB_SHA then WORKERS_CI then DEPLOY_GIT_SHA', () => {
  assert.equal(
    resolveDeployGitSha({ GITHUB_SHA: FULL, WORKERS_CI_COMMIT_SHA: 'b'.repeat(40) }),
    FULL,
  );
  assert.equal(
    resolveDeployGitSha({ WORKERS_CI_COMMIT_SHA: FULL }),
    FULL,
  );
  assert.equal(
    resolveDeployGitSha({ DEPLOY_GIT_SHA: SHORT }),
    SHORT,
  );
});

test('resolveDeployGitSha falls back to git rev-parse when env empty', () => {
  const sha = resolveDeployGitSha(
    {},
    {
      spawnSync: () => ({ status: 0, stdout: `${FULL}\n` }),
    },
  );
  assert.equal(sha, FULL);

  const missing = resolveDeployGitSha(
    {},
    {
      spawnSync: () => ({ status: 1, stdout: '' }),
    },
  );
  assert.equal(missing, null);
});

test('applyStampToRouterSource rewrites markers and verifies', () => {
  const src = [
    'const STAMPED_DEPLOY_GIT_SHA = null;',
    'const STAMPED_DEPLOY_AT = null;',
  ].join('\n');
  const result = applyStampToRouterSource(src, FULL, '2026-01-01T00:00:00.000Z');
  assert.equal(result.ok, true);
  assert.match(result.source, new RegExp(`STAMPED_DEPLOY_GIT_SHA = "${FULL}"`));
  assert.match(result.source, /STAMPED_DEPLOY_AT = "2026-01-01T00:00:00.000Z"/);

  const missing = applyStampToRouterSource('no marker here', FULL, 't');
  assert.equal(missing.ok, false);
  assert.match(missing.error, /marker missing/);
});

test('buildDeployIdentityModule embeds sha and timestamp', () => {
  const mod = buildDeployIdentityModule(SHORT, '2026-08-18T00:00:00.000Z');
  assert.match(mod, /do not edit/);
  assert.match(mod, new RegExp(`gitSha: "${SHORT}"`));
  assert.match(mod, /stampedAt: "2026-08-18T00:00:00.000Z"/);
});

test('runStampDeployIdentity writes entry + identity with injectable fs', () => {
  const files = {
    'src/routerEntry.js':
      'const STAMPED_DEPLOY_GIT_SHA = null;\nconst STAMPED_DEPLOY_AT = null;\n',
  };
  const result = runStampDeployIdentity({
    env: { GITHUB_SHA: FULL },
    now: () => '2026-08-18T12:00:00.000Z',
    readFileSync: (p) => files[p],
    writeFileSync: (p, data) => {
      files[p] = data;
    },
    existsSync: () => false,
    rmSync: () => {},
    spawnSync: () => ({ status: 1 }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.sha, FULL);
  assert.match(files['src/routerEntry.js'], new RegExp(FULL));
  assert.match(files['src/deployIdentity.js'], new RegExp(FULL));
});

test('runStampDeployIdentity skips cleanly when no sha', () => {
  const result = runStampDeployIdentity({
    env: {},
    spawnSync: () => ({ status: 1, stdout: '' }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.skipped, true);
});
