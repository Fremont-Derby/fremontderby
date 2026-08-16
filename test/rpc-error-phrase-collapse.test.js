import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/rpcErrorStatus.js'), 'utf8');
test('captain and application phrases use alternation not duplicate lines', () => {
  assert.match(src, /Only \(\?:the \|an \)?active captain/);
  assert.match(src, /\(\?:You \)?already have a team application/);
  assert.equal((src.match(/Only the active captain/g) || []).length, 0);
});
