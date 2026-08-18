import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/lane-health-monitor.yml', import.meta.url),
  'utf8',
);

test('lane-health-monitor workflow has expected name', () => {
  assert.match(workflow, /^name:\s*Lane health monitor\s*$/m);
});

test('lane-health-monitor runs core probe scripts', () => {
  assert.match(workflow, /scripts\/assert-production-dns\.mjs/);
  assert.match(workflow, /scripts\/assert-lane-health\.mjs/);
  assert.match(workflow, /scripts\/assert-public-surface\.mjs/);
  assert.match(workflow, /scripts\/diagnose-worker-domains\.mjs/);
});
