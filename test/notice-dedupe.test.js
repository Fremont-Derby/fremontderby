import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('the notices list collapses the same title and body', () => {
  const source = fs.readFileSync(new URL('../src/notificationsPage.js', import.meta.url), 'utf8');
  assert.match(source, /function dedupeNotices/);
  assert.match(source, /items=dedupeNotices\(items\)/);
});
