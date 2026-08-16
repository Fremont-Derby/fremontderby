import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
test('membership-requests aliases team-membership-requests', () => {
  const router = readFileSync(join(root, 'src/router.js'), 'utf8');
  const index = readFileSync(join(root, 'src/index.js'), 'utf8');
  assert.match(router, /membership-requests/);
  assert.match(index, /membership-requests/);
});
