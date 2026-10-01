import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/router.js'), 'utf8');
test('DM inbox accepts short path aliases', () => {
  assert.match(src, /\/api\/me\/dms/);
  assert.match(src, /\/api\/me\/direct-messages/);
});
