import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/sync-collaboration-labels.yml', import.meta.url),
  'utf8',
);

test('sync-collaboration-labels workflow name and script', () => {
  assert.match(workflow, /^name:\s*Sync collaboration labels\s*$/m);
  assert.match(workflow, /collaboration-labels\.mjs --sync/);
});
