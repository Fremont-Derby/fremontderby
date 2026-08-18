import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raw = readFileSync(new URL('../.github/collaboration-labels.json', import.meta.url), 'utf8');
const manifest = JSON.parse(raw);

test('collaboration-labels.json is a non-empty manifest', () => {
  assert.equal(typeof manifest, 'object');
  assert.ok(manifest);
  const blob = JSON.stringify(manifest);
  assert.ok(blob.includes('agent:dru'));
  assert.ok(blob.includes('stage:handoff'));
});
