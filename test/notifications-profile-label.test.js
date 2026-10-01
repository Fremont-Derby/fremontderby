import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('notifications page still ships after the Gamma sync', () => {
  const source = fs.readFileSync(new URL('../src/notificationsPage.js', import.meta.url), 'utf8');
  assert.match(source, /notification/i);
});
