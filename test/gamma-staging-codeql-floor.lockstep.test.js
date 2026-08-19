import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readWorkflow(name) {
  const path = join(root, '.github/workflows', name);
  assert.ok(existsSync(path), `${name} must exist`);
  return readFileSync(path, 'utf8');
}

test('gamma-rc-validation runs validate-gamma-rc and enforces release-source on PRs', () => {
  const src = readWorkflow('gamma-rc-validation.yml');
  assert.ok(src.includes('name: Gamma RC validation'));
  assert.ok(src.includes('name: gamma-rc'));
  assert.ok(src.includes('node scripts/validate-gamma-rc.mjs'));
  assert.ok(src.includes('node scripts/check-release-source-policy.mjs'));
  assert.ok(src.includes("STRICT_RELEASE_SOURCE_POLICY: '1'") || src.includes('STRICT_RELEASE_SOURCE_POLICY'));
  assert.ok(src.includes('pull_request:'));
  assert.ok(!/pull_request_target:/.test(src));
});

test('gamma-prod-refresh is schedule + dispatch only, dry-run by default', () => {
  const src = readWorkflow('gamma-prod-refresh.yml');
  assert.ok(src.includes('name: Gamma prod refresh'));
  assert.ok(src.includes("cron: '15 10 * * *'") || /cron:\s*'15 10/.test(src));
  assert.ok(src.includes('workflow_dispatch:'));
  assert.ok(!/pull_request:/.test(src) && !/push:/.test(src.split('on:')[1]?.split('jobs:')[0] || ''), 'must not auto-run on push/PR');
  assert.ok(src.includes('node scripts/gamma-prod-refresh.mjs'));
  assert.ok(src.includes('GAMMA_REFRESH_EXECUTE'));
  assert.ok(src.includes('test/gamma-refresh-preflight.test.js'));
});

test('staging-readiness uses smoke-release against an explicit staging URL', () => {
  const src = readWorkflow('staging-readiness.yml');
  assert.ok(src.includes('name: Staging readiness'));
  assert.ok(src.includes('workflow_dispatch:'));
  assert.ok(src.includes('node scripts/smoke-release.mjs'));
  assert.ok(src.includes('staging'));
});

test('CodeQL workflow analyzes javascript with security queries', () => {
  const src = readWorkflow('codeql.yml');
  assert.ok(src.includes('name: CodeQL'));
  assert.ok(src.includes('languages: javascript'));
  assert.ok(src.includes('queries: security'));
  assert.ok(src.includes('github/codeql-action/init@v3') || src.includes('codeql-action/init'));
  assert.ok(src.includes('github/codeql-action/analyze@v3') || src.includes('codeql-action/analyze'));
  assert.ok(existsSync(join(root, '.github/codeql/codeql-config.yml')));
});

test('package test:floor points at count-tests.mjs and the script exists', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['test:floor'], 'node scripts/count-tests.mjs');
  assert.ok(existsSync(join(root, 'scripts/count-tests.mjs')));
});

test('supporting pure scripts for gamma/staging/floor exist', () => {
  for (const rel of [
    'scripts/validate-gamma-rc.mjs',
    'scripts/gamma-prod-refresh.mjs',
    'scripts/smoke-release.mjs',
    'scripts/count-tests.mjs',
  ]) {
    assert.ok(existsSync(join(root, rel)), `${rel} must exist`);
  }
});
