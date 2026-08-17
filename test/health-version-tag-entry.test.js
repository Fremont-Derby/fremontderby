
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('routerEntry serves /health with deploy identity fallback', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(src, /pathname === '\/health'/);
  assert.match(src, /DEPLOY_IDENTITY/);
  assert.match(src, /deploy_identity/);
});

test('stamp-deploy-identity writes gitSha', async () => {
  const { spawnSync } = await import('node:child_process');
  const { readFileSync } = await import('node:fs');
  const r = spawnSync(process.execPath, ['scripts/stamp-deploy-identity.mjs'], {
    env: { ...process.env, GITHUB_SHA: 'deadbeefcafebabe0123456789abcdef01234567' },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const stamped = readFileSync(new URL('../src/deployIdentity.js', import.meta.url), 'utf8');
  assert.match(stamped, /deadbeefcafebabe0123456789abcdef01234567/);
  // restore null template for cleanliness in test env
  const { writeFileSync } = await import('node:fs');
  writeFileSync(
    new URL('../src/deployIdentity.js', import.meta.url),
    `/** Written by scripts/stamp-deploy-identity.mjs during deploy. Do not edit by hand for releases. */
export const DEPLOY_IDENTITY = {
  gitSha: null,
  stampedAt: null,
};
`,
  );
});
