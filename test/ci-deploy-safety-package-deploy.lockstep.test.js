import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('CI never deploys or touches Cloudflare secrets on pull_request', () => {
  const src = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.ok(src.includes('name: CI'));

  // deploy-nonproduction is push-only on lane branches
  assert.ok(src.includes('deploy-nonproduction:'));
  assert.ok(src.includes("github.event_name == 'push'"));
  assert.ok(src.includes('fremontderby-jfl'));
  assert.ok(src.includes('fremontderby-dru'));
  assert.ok(src.includes('fremontderby-gamma'));
  assert.ok(
    /deploy-nonproduction:[\s\S]*?if:[\s\S]*?github\.event_name == 'push'/.test(src),
    'deploy-nonproduction must be gated on push',
  );
  assert.ok(
    /deploy-nonproduction:[\s\S]*?if:[\s\S]*?github\.event\.pull_request == null/.test(src),
    'deploy-nonproduction must exclude pull_request',
  );

  // production-smoke is main push only
  assert.ok(src.includes('production-smoke:'));
  assert.ok(
    /production-smoke:[\s\S]*?if:[\s\S]*?github\.ref == 'refs\/heads\/main'/.test(src),
    'production-smoke must require main',
  );
  assert.ok(
    /production-smoke:[\s\S]*?if:[\s\S]*?github\.event_name == 'push'/.test(src),
    'production-smoke must be push-only',
  );

  // PR path jobs must not reference Cloudflare secrets
  const testJobSlice = src.split('deploy-nonproduction:')[0];
  assert.ok(!testJobSlice.includes('CLOUDFLARE_API_TOKEN'));
  assert.ok(!testJobSlice.includes('CLOUDFLARE_ACCOUNT_ID'));
});

test('package deploy scripts point at production and lane entrypoints', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const s = pkg.scripts || {};
  assert.equal(s.deploy, 'node scripts/deploy-production.mjs');
  assert.equal(s['deploy:production'], 'node scripts/deploy-production.mjs');
  assert.equal(s['deploy:jfl'], 'node scripts/deploy-lane.mjs jfl');
  assert.equal(s['deploy:dru'], 'node scripts/deploy-lane.mjs dru');
  assert.equal(s['deploy:gamma'], 'node scripts/deploy-lane.mjs gamma');
  assert.ok(existsSync(join(root, 'scripts/deploy-production.mjs')));
  assert.ok(existsSync(join(root, 'scripts/deploy-lane.mjs')));
});

test('routerEntry keeps STAMPED deploy identity markers for stamp-deploy-identity', () => {
  const src = readFileSync(join(root, 'src/routerEntry.js'), 'utf8');
  assert.ok(src.includes('const STAMPED_DEPLOY_GIT_SHA'), 'STAMPED_DEPLOY_GIT_SHA marker required');
  assert.ok(src.includes('const STAMPED_DEPLOY_AT'), 'STAMPED_DEPLOY_AT marker required');
  assert.ok(src.includes('versionTagSource'), 'health must expose versionTagSource');
  assert.ok(existsSync(join(root, 'scripts/stamp-deploy-identity.mjs')));
});

test('wrangler main entry remains src/routerEntry.js (stamp + health identity)', () => {
  const wrangler = readFileSync(join(root, 'wrangler.jsonc'), 'utf8');
  assert.ok(/"main"\s*:\s*"src\/routerEntry\.js"/.test(wrangler));
});
