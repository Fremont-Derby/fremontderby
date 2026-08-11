import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync('src/router.js', 'utf8');
const shell = fs.readFileSync('src/appShell.js', 'utf8');

test('Worker routes the messages page and authenticated team chat APIs', () => {
  assert.match(router, /url\.pathname === '\/messages'/);
  assert.match(router, /url\.pathname === '\/api\/me\/chat-threads'/);
  assert.match(router, /api\\\/teams\\\/\(\[\^\/\]\+\)\\\/messages\$/);
  assert.match(router, /chatHttpHandlers\.listTeamMessages/);
  assert.match(router, /chatHttpHandlers\.sendTeamMessage/);
  assert.match(router, /chatHttpHandlers\.markTeamChatRead/);
});

test('shared navigation treats messages as a first-class app page', () => {
  assert.match(shell, /href: '\/messages', label: 'Messages'/);
  assert.match(shell, /'\/messages'/);
  assert.match(shell, /pathname\.startsWith\('\/messages'\)/);
});
