import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/router.js'), 'utf8');
test('scorable matches accepts /api/me/matches alias', () => {
  assert.match(src, /scorable-matches' \|\| url\.pathname === '\/api\/me\/matches/);
});
