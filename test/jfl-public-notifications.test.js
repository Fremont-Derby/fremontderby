import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import routerEntry from '../src/routerEntry.js';

test('JFL router entry intercepts /notifications before the 404 hound', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(src, /renderNotificationsPage/);
  assert.match(src, /pathname === '\/notifications'/);
});

test('JFL worker serves /notifications as HTML 200', async () => {
  const response = await routerEntry.fetch(
    new Request('https://jfl.fremontderby.test/notifications'),
    { ENVIRONMENT: 'jfl' },
    {},
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Notifications · Fremont Derby/);
  assert.match(html, /data-fd-notifications/);
  assert.match(html, /\/api\/me\/message-notification-summary/);
  assert.doesNotMatch(html, /This dog lost the rack/);
});
