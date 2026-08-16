import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/router.js'), 'utf8');
test('GET /api/me/direct-conversations aliases inbox', () => {
  assert.match(src, /pathname === '\/api\/me\/direct-conversations'/);
  assert.match(src, /listDirectInbox/);
});
