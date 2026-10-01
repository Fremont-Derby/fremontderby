import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('a notice with no target falls back to the schedule', () => {
  const source = fs.readFileSync(new URL('../src/notificationsPage.js', import.meta.url), 'utf8');
  assert.match(source, /return '\/schedule';/);
  assert.doesNotMatch(source, /return '';/);
  assert.match(source, /Open schedule/);
});
