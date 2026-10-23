import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/jfl-two-captain-browser.yml', import.meta.url), 'utf8');

test('ephemeral browser runner checks out only the trusted permanent JFL push', () => {
  assert.match(workflow, /on:\s*\n\s*push:\s*\n\s*branches: \[fremontderby-jfl\]/);
  assert.doesNotMatch(workflow, /pull_request|workflow_dispatch/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/fremontderby-jfl' && github\.actor == 'subiki'/);
  // Browser execution is on an ephemeral hosted machine; never run PR code on a persistent group.
  assert.match(workflow, /browser:\s*\n\s*needs: reset-fixture\s*\n\s*runs-on: ubuntu-latest/);
  assert.doesNotMatch(workflow, /self-hosted|Windows, X64, fremont-browser/);
  assert.match(workflow, /npx playwright install --with-deps chromium/);
  assert.equal((workflow.match(/ref: \$\{\{ github\.sha \}\}/g) || []).length, 2);
  assert.equal((workflow.match(/persist-credentials: false/g) || []).length, 2);
});

test('staging key remains on GitHub-hosted reset job and browser artifacts retain failure evidence', () => {
  const hosted = workflow.split('  browser:')[0];
  const browser = workflow.split('  browser:')[1];
  assert.match(hosted, /reset-fixture:[\s\S]*runs-on: ubuntu-latest/);
  assert.match(hosted, /STAGING_SUPABASE_SERVICE_ROLE_KEY: \$\{\{ secrets\.STAGING_SUPABASE_SERVICE_ROLE_KEY \}\}/);
  assert.doesNotMatch(browser, /secrets\.|STAGING_SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(browser, /PLAYWRIGHT_BROWSERS_PATH|powershell/i);
  assert.match(browser, /needs: reset-fixture/);
  assert.match(browser, /PLAYWRIGHT_EXPECTED_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(hosted, /scheduled_on: \$\{\{ steps\.prepare\.outputs\.scheduled_on \}\}/);
  assert.match(browser, /PLAYWRIGHT_FIXTURE_DATE: \$\{\{ needs\.reset-fixture\.outputs\.scheduled_on \}\}/);
  assert.match(browser, /PLAYWRIGHT_LIVE_SEASON_READBACK: '1'/);
  assert.doesNotMatch(hosted, /PLAYWRIGHT_LIVE_SEASON_READBACK/);
  assert.match(browser, /if: always\(\)[\s\S]*playwright-report\/\s*\n\s*test-results\//);
  // Browser specs import a Wrangler-emitted bundle even when visiting live pages.
  assert.match(browser, /run: npm run build/);
  assert.ok(browser.indexOf('run: npm run build') > browser.indexOf('run: npm ci'));
  assert.ok(browser.indexOf('run: npm run build') < browser.indexOf('run: npm run test:browser:jfl'));
});
