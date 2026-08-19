import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import worker from '../src/routerEntry.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function healthJson(env) {
  const response = await worker.fetch(
    new Request('https://fremontderby.com/health'),
    env,
    {},
  );
  assert.equal(response.status, 200);
  return response.json();
}

test('/health prefers CF metadata.tag over DEPLOY_GIT_SHA and version id', async () => {
  const body = await healthJson({
    CF_VERSION_METADATA: { id: 'cf-version-id', tag: 'meta-tag-sha', timestamp: '2026-01-01T00:00:00.000Z' },
    DEPLOY_GIT_SHA: 'env-deploy-sha',
  });
  assert.equal(body.ok, true);
  assert.equal(body.service, 'fremontderby');
  assert.equal(body.versionTag, 'meta-tag-sha');
  assert.equal(body.versionTagSource, 'cf_metadata');
});

test('/health falls back to DEPLOY_GIT_SHA when metadata.tag is empty', async () => {
  const body = await healthJson({
    CF_VERSION_METADATA: { id: 'cf-version-id', tag: '  ', timestamp: null },
    DEPLOY_GIT_SHA: 'env-deploy-sha',
  });
  assert.equal(body.versionTag, 'env-deploy-sha');
  assert.equal(body.versionTagSource, 'DEPLOY_GIT_SHA');
});

test('/health falls back to CF version id when tag and DEPLOY_GIT_SHA are absent', async () => {
  const body = await healthJson({
    CF_VERSION_METADATA: { id: 'cf-version-id-only' },
  });
  assert.equal(body.versionTag, 'cf-version-id-only');
  assert.equal(body.versionTagSource, 'cf_version_id');
});

test('/health ignores local CF version id placeholder', async () => {
  const body = await healthJson({
    CF_VERSION_METADATA: { id: 'local' },
  });
  assert.equal(body.versionTag, null);
  assert.equal(body.versionTagSource, null);
});

test('routerEntry documents resolution order cf_metadata → DEPLOY_GIT_SHA → stamped_source → cf_version_id', () => {
  const src = readFileSync(join(root, 'src/routerEntry.js'), 'utf8');
  assert.ok(src.includes("versionTagSource = 'cf_metadata'"));
  assert.ok(src.includes("versionTagSource = 'DEPLOY_GIT_SHA'"));
  assert.ok(src.includes("versionTagSource = 'stamped_source'"));
  assert.ok(src.includes("versionTagSource = 'cf_version_id'"));
  const metaIdx = src.indexOf("versionTagSource = 'cf_metadata'");
  const envIdx = src.indexOf("versionTagSource = 'DEPLOY_GIT_SHA'");
  const stampIdx = src.indexOf("versionTagSource = 'stamped_source'");
  const idIdx = src.indexOf("versionTagSource = 'cf_version_id'");
  assert.ok(metaIdx < envIdx && envIdx < stampIdx && stampIdx < idIdx);
});

test('stamp-deploy-identity prefers GITHUB_SHA then WORKERS_CI_COMMIT_SHA then DEPLOY_GIT_SHA', () => {
  const src = readFileSync(join(root, 'scripts/stamp-deploy-identity.mjs'), 'utf8');
  const github = src.indexOf('process.env.GITHUB_SHA');
  const workers = src.indexOf('process.env.WORKERS_CI_COMMIT_SHA');
  const deploy = src.indexOf('process.env.DEPLOY_GIT_SHA');
  assert.ok(github >= 0 && workers >= 0 && deploy >= 0);
  assert.ok(github < workers && workers < deploy);
  assert.ok(src.includes('STAMPED_DEPLOY_GIT_SHA'));
  assert.ok(src.includes('src/routerEntry.js'));
});
