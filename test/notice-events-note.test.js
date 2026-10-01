import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('the notices page names the events that create a notice', () => {
  const source = fs.readFileSync(new URL('../src/notificationsPage.js', import.meta.url), 'utf8');
  assert.match(source, /data-notice-events/);
  assert.match(source, /lineup or match ready check/);
  assert.match(source, /report outcome/);
});
