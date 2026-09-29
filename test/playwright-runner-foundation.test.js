import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('browser workflow stays manual, main-only, and pinned to the isolated runner group', async () => {
  const workflow = await read('.github/workflows/playwright-browser-smoke.yml');

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /group: fremont-browser/);
  assert.match(workflow, /labels: \[self-hosted, Windows, X64, fremont-browser\]/);
  assert.match(workflow, /permissions:\s+contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /SUPABASE|CLOUDFLARE|secrets\./);
});

test('browser dependency and Chromium install are reproducible', async () => {
  const packageJson = JSON.parse(await read('package.json'));
  const lockfile = JSON.parse(await read('package-lock.json'));

  assert.match(packageJson.devDependencies['@playwright/test'], /^\d+\.\d+\.\d+$/);
  assert.equal(packageJson.scripts['browser:install'], 'playwright install chromium');
  assert.equal(packageJson.scripts['test:browser:smoke'], 'playwright test browser/smoke');
  assert.equal(lockfile.lockfileVersion, 3);
});
