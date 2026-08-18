import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('AGENTS.md encodes shared infrastructure mutation rule from #680', () => {
  const text = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
  assert.match(text, /### Shared infrastructure mutation rule/);
  assert.match(text, /must use a dedicated implementation card and focused PR/);
  assert.match(text, /both JFL and DRU must record explicit review agreement/);
  assert.match(text, /fail closed when current external state cannot be positively determined/);
  assert.match(text, /must never introduce, broaden, or increase the frequency of such mutation/);
});
