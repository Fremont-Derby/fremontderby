import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('profile shows season and payment status', () => {
  const src = readFileSync(new URL('../src/profilePage.js', import.meta.url), 'utf8');
  assert.match(src, /data-season-status-summary/);
  assert.match(src, /paymentStatus/);
  assert.match(src, /Payment waived|Payment due/);
});
