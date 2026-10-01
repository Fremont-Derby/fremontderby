import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/index.js'), 'utf8');
test('invitation respond accepts decision/action/accept aliases', () => {
  assert.match(src, /body\.decision/);
  assert.match(src, /body\.action/);
  assert.match(src, /body\.accept === true/);
});
