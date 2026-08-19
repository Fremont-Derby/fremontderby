import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GIT_SHA_RE,
  resolveDeployGitSha,
  applyStampToRouterSource,
  deployIdentityModuleSource,
  runStampDeployIdentity,
} from '../scripts/stamp-deploy-identity.mjs';

const FULL = 'a'.repeat(40);
const SHORT = 'abcdef1';

test('GIT_SHA_RE accepts 7–40 hex and rejects junk', () => {
  assert.equal(GIT_SHA_RE.test(FULL), true);
  assert.equal(GIT_SHA_RE.test(SHORT), true);
  assert.equal(GIT_SHA_RE.test('zzzzzzz'), false);
  assert.equal(GIT_SHA_RE.test('abc'), false);
});

test('resolveDeployGitSha prefers GITHUB_SHA then WORKERS_CI then DEPLOY_GIT_SHA', () => {
  assert.equal(
    resolveDeployGitSha({
      GITHUB_SHA: FULL,
      WORKERS_CI_COMMIT_SHA: 'b'.repeat(40),
      DEPLOY_GIT_SHA: SHORT,
    }),
    FULL,
  );
  assert.equal(
    resolveDeployGitSha({
      WORKERS_CI_COMMIT_SHA: FULL,
      DEPLOY_GIT_SHA: SHORT,
    }),
    FULL,
  );
  assert.equal(resolveDeployGitSha({ DEPLOY_GIT_SHA: SHORT }), SHORT);
});

test('resolveDeployGitSha falls back to git rev-parse when env empty', () => {
  const sha = resolveDeployGitSha({}, () => ({ status: 0, stdout: `${FULL}\n` }));
  assert.equal(sha, FULL);
  assert.equal(
    resolveDeployGitSha({}, () => ({ status: 1, stdout: '' })),
    null,
  );
});

test('applyStampToRouterSource replaces both stamp constants', () => {
  const source = [
    '// header',
    'const STAMPED_DEPLOY_GIT_SHA = null;',
    'const STAMPED_DEPLOY_AT = null;',
    'export default {};',
  ].join('\n');
  const next = applyStampToRouterSource(source, FULL, '2026-01-01T00:00:00.000Z');
  assert.match(next, new RegExp(`const STAMPED_DEPLOY_GIT_SHA = "${FULL}";`));
  assert.match(next, /const STAMPED_DEPLOY_AT = "2026-01-01T00:00:00\.000Z";/);
  assert.throws(
    () => applyStampToRouterSource('no marker here', FULL, 't'),
    /STAMPED_DEPLOY_GIT_SHA marker missing/,
  );
});

test('deployIdentityModuleSource is deterministic generated module', () => {
  const mod = deployIdentityModuleSource(SHORT, '2026-02-02T00:00:00.000Z');
  assert.match(mod, /do not edit/);
  assert.match(mod, new RegExp(`gitSha: "${SHORT}"`));
  assert.match(mod, /stampedAt: "2026-02-02T00:00:00\.000Z"/);
});

test('runStampDeployIdentity is pure with injected IO and verifies write', () => {
  const files = {
    'src/routerEntry.js': 'const STAMPED_DEPLOY_GIT_SHA = null;\nconst STAMPED_DEPLOY_AT = null;\n',
  };
  const result = runStampDeployIdentity({
    env: { GITHUB_SHA: FULL },
    readFile: (p) => files[p],
    writeFile: (p, body) => {
      files[p] = body;
    },
    exists: () => false,
    remove: () => {
      throw new Error('should not clear');
    },
    now: () => '2026-03-03T00:00:00.000Z',
  });
  assert.equal(result.stamped, true);
  assert.equal(result.sha, FULL);
  assert.ok(files['src/routerEntry.js'].includes(JSON.stringify(FULL)));
  assert.ok(files['src/deployIdentity.js'].includes(FULL));
});

test('runStampDeployIdentity exits soft when no SHA available', () => {
  const result = runStampDeployIdentity({
    env: {},
    spawn: () => ({ status: 1, stdout: '' }),
    readFile: () => {
      throw new Error('should not read');
    },
  });
  assert.deepEqual(result, { ok: true, stamped: false });
});
