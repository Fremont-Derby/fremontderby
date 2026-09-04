import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync('src/router.js', 'utf8');
const shell = fs.readFileSync('src/appShell.js', 'utf8');

test('Worker routes the messages page and authenticated team chat APIs', () => {
  assert.match(router, /url\.pathname === '\/messages'/);
  assert.match(router, /url\.pathname === '\/messages\/moderation'/);
  assert.match(router, /chatHttpHandlers/);
  assert.match(router, /\/api\/me\/chat-threads|message-notification-summary|\/messages/);
});

test('Worker routes authenticated direct messages, reads, and player blocks', () => {
  assert.match(router, /direct-message|blocked-players|direct-conversations/);
});

test('Worker routes league rooms, message reports, and admin moderation', () => {
  assert.match(router, /league-chat|chat-reports/);
});

test('Worker routes authenticated matchup chat threads', () => {
  assert.match(router, /matchup-chat/);
});

test('shared navigation treats messages as a first-class app page', () => {
  assert.match(shell, /href: '\/messages', label: 'Messages'/);
  assert.match(shell, /data-message-indicator|data-message-badge/);
});
