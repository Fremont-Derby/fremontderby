import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/router.js'), 'utf8');
test('matchup chat accepts /chat alias', () => {
  assert.match(src, /team-matches\/\(\[^\/\]\+\)\\\/\(\?:messages\|chat\)/);
});
