import assert from 'node:assert/strict';
import test from 'node:test';
import { renderNotificationsPage } from '../src/notificationsPage.js';

test('notifications links to Profile instead of Sign in', () => {
  const html = renderNotificationsPage();
  assert.match(html, /href="\/profile">Profile</);
  assert.doesNotMatch(html, />Sign in</);
});

test('notifications sends players to Schedule for the next match', () => {
  const html = renderNotificationsPage();
  assert.match(html, /data-next-match/);
  assert.match(html, /href="\/schedule">Schedule</);
  assert.match(html, /next published match/i);
});
