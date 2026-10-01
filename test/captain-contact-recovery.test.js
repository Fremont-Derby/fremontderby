import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Profile contact recovery flags active captains missing phone', () => {
  const src = readFileSync(new URL('../src/profileContactEnhancer.js', import.meta.url), 'utf8');
  assert.match(src, /activeCaptain/);
  assert.match(src, /Required now/);
  assert.match(src, /captain contact is incomplete/);
  assert.match(src, /\/api\/me\/profile/);
});

test('Admin player contact page is one-at-a-time reveal only', () => {
  const page = readFileSync(new URL('../src/adminPlayerContactPage.js', import.meta.url), 'utf8');
  const entry = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(page, /\/api\/admin\/players\//);
  assert.match(page, /reveal=1/);
  assert.match(page, /Show phone number/);
  assert.match(entry, /\/admin\/player-contact/);
  assert.match(entry, /renderAdminPlayerContactPage/);
});
