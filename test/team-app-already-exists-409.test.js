import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/rpcErrorStatus.js'), 'utf8');
test('team application already exists maps via phrase list', () => {
  assert.match(src, /You already have a team application/);
});
