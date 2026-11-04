import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('optional actor setup cannot disable the mandatory baseline reset or browser gates', () => {
  const workflow=readFileSync(new URL('../.github/workflows/jfl-two-captain-browser.yml',import.meta.url),'utf8');
  const start=workflow.indexOf('      - name: Qualify dedicated non-login JFL full-season principals');
  const reset=workflow.indexOf('      - name: Wait for exact deployed JFL SHA, then reset the fixed QA fixture');
  const browser=workflow.indexOf('\n  browser:');
  assert.ok(start>0&&reset>start&&browser>reset);
  const optional=workflow.slice(start,reset);
  assert.match(optional,/if: vars\.JFL_BOOTSTRAP_FULL_SEASON_ACTORS == '1'/);
  assert.doesNotMatch(workflow.slice(reset,browser),/if:|continue-on-error:/);
  assert.match(workflow.slice(browser),/needs: reset-fixture/);
  assert.match(workflow,/PLAYWRIGHT_EXPECTED_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(workflow,/PLAYWRIGHT_FIXTURE_DATE: \$\{\{ needs\.reset-fixture\.outputs\.scheduled_on \}\}/);
  assert.match(workflow,/github\.actor == 'subiki'/);
  assert.match(workflow,/test "\$\(git rev-parse HEAD\)" = "\$GITHUB_SHA"/);
  assert.doesNotMatch(workflow,/continue-on-error:|pull_request:/);
});
