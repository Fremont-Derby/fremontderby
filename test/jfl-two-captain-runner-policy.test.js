import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/jfl-two-captain-browser.yml', import.meta.url), 'utf8');

test('persistent browser runner checks out only the trusted permanent JFL push', () => {
  assert.match(workflow, /on:\s*\n\s*push:\s*\n\s*branches: \[fremontderby-jfl\]/);
  assert.doesNotMatch(workflow, /pull_request|workflow_dispatch/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/fremontderby-jfl' && github\.actor == 'subiki'/);
  assert.match(workflow, /group: fremont-browser\s*\n\s*labels: \[self-hosted, Windows, X64, fremont-browser\]/);
  assert.equal((workflow.match(/ref: \$\{\{ github\.sha \}\}/g) || []).length, 2);
  assert.equal((workflow.match(/persist-credentials: false/g) || []).length, 2);
});

test('staging key remains on GitHub-hosted reset job and browser artifacts retain failure evidence', () => {
  const hosted = workflow.split('  browser:')[0];
  const browser = workflow.split('  browser:')[1];
  assert.match(hosted, /reset-fixture:[\s\S]*runs-on: ubuntu-latest/);
  assert.match(hosted, /STAGING_SUPABASE_SERVICE_ROLE_KEY: \$\{\{ secrets\.STAGING_SUPABASE_SERVICE_ROLE_KEY \}\}/);
  assert.doesNotMatch(browser, /secrets\.|STAGING_SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(browser, /needs: reset-fixture/);
  assert.match(browser, /PLAYWRIGHT_EXPECTED_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(browser, /if: always\(\)[\s\S]*playwright-report\/\s*\n\s*test-results\//);
});
