import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('browser workflow stays manual, main-only, and pinned to the isolated runner group', async () => {
  const workflow = await read('.github/workflows/playwright-browser-smoke.yml');

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /options: \[smoke, controlled-failure, runner-recovery\]/);
  assert.match(workflow, /if: inputs\.evidence_mode == 'runner-recovery'/);
  assert.match(workflow, /Stop-Process -Id \$listener\.Id -Force/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /group: fremont-browser/);
  assert.match(workflow, /labels: \[self-hosted, Windows, X64, fremont-browser\]/);
  assert.match(workflow, /permissions:\s+contents: read/);
  assert.match(workflow, /defaults:\s+run:\s+shell: powershell -NoProfile -ExecutionPolicy Bypass/);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /SUPABASE|CLOUDFLARE|secrets\./);
  assert.doesNotMatch(workflow, /type:\s*string|ref: \$\{\{ inputs\.|PLAYWRIGHT_BASE_URL: \$\{\{ inputs\./);
});

test('browser dependency and Chromium install are reproducible', async () => {
  const packageJson = JSON.parse(await read('package.json'));
  const lockfile = JSON.parse(await read('package-lock.json'));

  assert.match(packageJson.devDependencies['@playwright/test'], /^\d+\.\d+\.\d+$/);
  assert.equal(packageJson.scripts['browser:install'], 'playwright install chromium');
  assert.equal(packageJson.scripts['test:browser:smoke'], 'playwright test browser/smoke');
  assert.equal(lockfile.lockfileVersion, 3);
});
