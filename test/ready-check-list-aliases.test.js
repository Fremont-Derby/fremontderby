import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/router.js'), 'utf8');
test('ready-check list accepts singular and pending aliases', () => {
  assert.match(src, /\/api\/me\/ready-check'/);
  assert.match(src, /\/api\/ready-checks\/pending/);
});
