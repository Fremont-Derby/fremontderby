import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/restore-lane-custom-domains.yml', import.meta.url),
  'utf8',
);

test('restore workflow has expected name', () => {
  assert.match(workflow, /^name:\s*Restore lane custom domains\s*$/m);
});

test('restore workflow runs restore script and DNS guard', () => {
  assert.match(workflow, /scripts\/restore-lane-custom-domains\.mjs/);
  assert.match(workflow, /scripts\/assert-production-dns\.mjs/);
});
