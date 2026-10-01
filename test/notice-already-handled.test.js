import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('a resolved notice is marked already handled', () => {
  const source = fs.readFileSync(new URL('../src/notificationsPage.js', import.meta.url), 'utf8');
  assert.match(source, /Already handled/);
  assert.match(source, /if\(href && !stale\)/);
});
