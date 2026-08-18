import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/hourly-live-probe.yml', import.meta.url),
  'utf8',
);

test('hourly-live-probe workflow name and script', () => {
  assert.match(workflow, /^name:\s*Hourly live probe\s*$/m);
  assert.match(workflow, /hourly-live-probe\.mjs/);
});
