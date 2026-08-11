import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync('src/router.js', 'utf8');
const shell = fs.readFileSync('src/appShell.js', 'utf8');

test('Worker routes the messages page and authenticated team chat APIs', () => {
  assert.match(router, /url\.pathname === '\/messages'/);
  assert.match(router, /url\.pathname === '\/messages\/moderation'/);
  assert.match(router, /url\.pathname === '\/api\/me\/chat-threads'/);
  assert.match(router, /api\\\/teams\\\/\(\[\^\/\]\+\)\\\/messages\$/);
  assert.match(router, /chatHttpHandlers\.listTeamMessages/);
  assert.match(router, /chatHttpHandlers\.sendTeamMessage/);
  assert.match(router, /chatHttpHandlers\.markTeamChatRead/);
});

test('Worker routes authenticated direct messages, reads, and player blocks', () => {
  assert.match(router, /url\.pathname === '\/api\/me\/direct-message-inbox'/);
  assert.match(router, /url\.pathname === '\/api\/me\/direct-message-candidates'/);
  assert.match(router, /url\.pathname === '\/api\/me\/blocked-players'/);
  assert.match(router, /url\.pathname === '\/api\/direct-conversations'/);
  assert.match(router, /directMessagesMatch/);
  assert.match(router, /directReadMatch/);
  assert.match(router, /playerBlockMatch/);
  assert.match(router, /request\.method === 'DELETE'/);
});

test('Worker routes league rooms, message reports, and admin moderation', () => {
  assert.match(router, /url\.pathname === '\/api\/me\/league-chat-threads'/);
  assert.match(router, /leagueMessagesMatch/);
  assert.match(router, /leagueReadMatch/);
  assert.match(router, /url\.pathname === '\/api\/chat-reports'/);
  assert.match(router, /url\.pathname === '\/api\/admin\/chat-reports'/);
  assert.match(router, /moderateChatReportMatch/);
});

test('Worker routes authenticated matchup chat threads', () => {
  assert.match(router, /url\.pathname === '\/api\/me\/matchup-chat-threads'/);
  assert.match(router, /matchupMessagesMatch/);
  assert.match(router, /matchupReadMatch/);
  assert.match(router, /chatHttpHandlers\.sendMatchupMessage/);
});

test('shared navigation treats messages as a first-class app page', () => {
  assert.match(shell, /href: '\/messages', label: 'Messages'/);
  assert.match(shell, /'\/messages'/);
  assert.match(shell, /pathname\.startsWith\('\/messages'\)/);
});
