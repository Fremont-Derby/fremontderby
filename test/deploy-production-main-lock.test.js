import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/deploy-production.mjs', import.meta.url), 'utf8');

test('deploy-production refuses non-main Workers CI branches', () => {
  assert.match(source, /WORKERS_CI_BRANCH/);
  assert.match(source, /branch !== 'main'/);
  assert.match(source, /Refusing production deploy from non-production branch/);
});
