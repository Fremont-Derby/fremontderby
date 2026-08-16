import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/index.js'), 'utf8');
test('admin review and slot manage accept decision aliases', () => {
  assert.match(src, /normalizeApproveDecline\(body\) \?\? body\.decision/);
  assert.match(src, /body\.action \?\? body\.decision \?\? body\.response/);
});
