import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  listMyNotificationsCommand,
  adminBroadcastNotificationCommand,
} from '../src/notificationCommands.js';
import { renderNotificationsPage } from '../src/notificationsPage.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';

test('notification commands list and broadcast', async () => {
  const repository = {
    async listMyNotifications() {
      return [{ id: 'n1', title: 'Hello', body: 'World', readAt: null }];
    },
    async adminBroadcastNotification(payload) {
      return { sent: 3, ...payload };
    },
  };
  const listed = await listMyNotificationsCommand({ actorUserId: 'u1' }, repository);
  assert.equal(listed[0].id, 'n1');
  const sent = await adminBroadcastNotificationCommand(
    { actorUserId: 'admin', title: 'Venue change', body: 'Tables move to back room.' },
    repository,
  );
  assert.equal(sent.sent, 3);
});

test('notifications page and APIs are wired in source', () => {
  const html = renderNotificationsPage();
  assert.match(html, /Mark all read/);
  assert.match(html, /\/api\/me\/notifications/);
  const index = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(index, /\/api\/admin\/notifications\/broadcast/);
  assert.match(index, /lineup_locked/);
  assert.match(index, /handleTeamMatchDisputeRequest/);
});

test('standings exposes singles cutoff why text', () => {
  const html = renderStandingsPage();
  assert.match(html, /singlesCutoffNote/);
});

test('practice past one-off and no-show protocol surfaces', () => {
  assert.match(renderTeamsPage(), /Past one-off|practiceRecurrence/);
  assert.match(renderSchedulePage(), /No-show/);
});

test('notifications migration defines inbox and broadcast', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260814160000_user_notifications.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /user_notifications/);
  assert.match(sql, /admin_broadcast_notification/);
  assert.match(sql, /list_my_notifications/);
});
