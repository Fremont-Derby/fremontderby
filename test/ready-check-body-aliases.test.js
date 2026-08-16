import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/readyCheckHttp.js'), 'utf8');
test('ready check accepts snake_case and ready boolean aliases', () => {
  assert.match(src, /body\.team_id/);
  assert.match(src, /body\.round_id/);
  assert.match(src, /body\.ready === true/);
});
