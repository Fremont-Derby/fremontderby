import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const agents = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');

test('AGENTS.md includes shared infrastructure mutation rule', () => {
  assert.match(agents, /Shared infrastructure mutation rule/i);
  assert.match(agents, /shared external infrastructure/i);
  assert.match(agents, /fail closed/i);
});

test('AGENTS.md requires cross-lane agreement for shared mutation', () => {
  assert.match(agents, /both JFL and DRU/i);
  assert.match(agents, /Merge Ready/i);
});
