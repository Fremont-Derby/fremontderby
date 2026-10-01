import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('moderation says a report does not open unrelated messages', () => {
  const source = fs.readFileSync(new URL('../src/chatModerationPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-report-privacy/);
  assert.match(source, /unrelated private messages/);
});
