import assert from 'node:assert/strict';
import test from 'node:test';
import { renderNotificationsPage } from '../src/notificationsPage.js';

test('notifications links to Profile instead of Sign in', () => {
  const html = renderNotificationsPage();
  assert.match(html, /href="\/profile">Profile</);
  assert.doesNotMatch(html, />Sign in</);
});
