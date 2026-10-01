import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('admin gateway links score and standings', () => {
  const src = readFileSync(new URL('../src/adminGatewayPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/standings"/);
  assert.match(src, /Score hub/);
});
