import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('gateway names the workflow health list', () => {
  const src = readFileSync(new URL('../src/adminGatewayPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderAdminGatewayPage/);
  assert.match(src, /href="\/admin\/operations"/);
  assert.match(src, /href="\/admin\/players"/);
  assert.match(src, /href="\/admin\/seasons"/);
});
