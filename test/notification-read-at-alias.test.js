import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/notificationRepository.js'), 'utf8');
test('notifications expose read_at alongside readAt', () => {
  assert.match(src, /read_at: row\.read_at/);
  assert.match(src, /read_at: row\?\.read_at/);
});
