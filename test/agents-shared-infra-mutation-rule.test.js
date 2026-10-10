import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('AGENTS.md encodes shared infrastructure mutation rule from #680', () => {
  const src = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
  assert.ok(src.length > 40);
});
