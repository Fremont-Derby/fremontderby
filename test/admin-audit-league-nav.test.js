import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('admin audit nav includes season setup and standings', () => {
  const src = readFileSync(new URL('../src/adminAuditPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/season-setup"/);
  assert.match(src, /href="\/standings"/);
  assert.match(src, /href="\/teams"/);
});
