import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/index.js'), 'utf8');
test('practice handler accepts location/time/recurring aliases', () => {
  assert.match(src, /body\.location/);
  assert.match(src, /body\.time/);
  assert.match(src, /body\.recurring/);
});
