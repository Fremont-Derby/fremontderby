import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/rpcErrorStatus.js'), 'utf8');
test('captain and application phrases use alternation not duplicate lines', () => {
  assert.ok(src.includes('Only (?:the |an )?active captain'));
  assert.ok(src.includes('(?:You )?already have a team application'));
  assert.equal(src.includes('Only the active captain'), false);
});
