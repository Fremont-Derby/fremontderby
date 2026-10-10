import test from 'node:test';
import assert from 'node:assert/strict';
import { renderChatPage } from '../src/chatPage.js';
import { renderProfilePage } from '../src/profilePage.js';
import { renderJflNotificationsPage } from '../src/jflNotificationsPage.js';
import { renderJflFreeAgentsPage } from '../src/jflFreeAgentsPage.js';

const chat = renderChatPage();
const profile = renderProfilePage();
const notices = renderJflNotificationsPage();
const freeAgents = renderJflFreeAgentsPage();

test('messages page is titled Messages', () => {
  assert.match(chat, /<title>Messages · Fremont Derby/);
  assert.match(chat, /<h1[^>]*>Messages</);
});

test('messages page says coordination does not share phone numbers', () => {
  assert.match(chat, /without sharing phone numbers/);
});

test('messages page shows a checking state and an unavailable state', () => {
  assert.match(chat, /Checking your messages/);
  assert.match(chat, /Messages unavailable/);
});

test('messages page offers a sign-in path', () => {
  assert.match(chat, /Sign in to message/);
});

test('messages page offers a way to start a new player message', () => {
  assert.match(chat, /New player message/);
  assert.match(chat, /Start message/);
});

test('messages page says when no other players are available to message', () => {
  assert.match(chat, /No other registered players are available to message yet/);
});

test('messages page offers load older, send, and report', () => {
  assert.match(chat, /Load older messages/);
  assert.match(chat, />Send</);
  assert.match(chat, /Submit report/);
});

test('messages page offers block and cancel', () => {
  assert.match(chat, />Block</);
  assert.match(chat, />Cancel</);
});

test('messages page links to moderation and the profile', () => {
  assert.match(chat, /href="\/messages\/moderation"/);
  assert.match(chat, /Review reports/);
  assert.match(chat, /href="\/profile"/);
});

test('profile page is titled Profile', () => {
  assert.match(profile, /<title>Fremont Derby Profile/);
});

test('profile page shows signed-out and a Google sign-in path', () => {
  assert.match(profile, /Signed out/);
  assert.match(profile, /Continue with Google/);
  assert.match(profile, /Checking sign-in/);
});

test('profile page offers refresh and sign out', () => {
  assert.match(profile, /Refresh profile/);
  assert.match(profile, /Sign out/);
});

test('profile page offers a display name and save', () => {
  assert.match(profile, /Add your name/);
  assert.match(profile, /Display name/);
  assert.match(profile, /Save profile/);
});

test('profile page shows a not-rated state', () => {
  assert.match(profile, /Not rated/);
});

test('profile page shows admin tools for a league admin', () => {
  assert.match(profile, /League admin/);
  assert.match(profile, /Admin tools/);
  assert.match(profile, /Manage players, league health, season setup, and reported messages/);
});

test('profile page links to players, operations, season setup, and moderation', () => {
  assert.match(profile, /href="\/admin\/players"/);
  assert.match(profile, /href="\/admin\/operations"/);
  assert.match(profile, /href="\/season-setup"/);
  assert.match(profile, /href="\/messages\/moderation"/);
});

test('profile page shows loading for memberships and participation', () => {
  assert.match(profile, /Loading team memberships/);
  assert.match(profile, /Loading season participation/);
});

test('notices page is titled Notices', () => {
  assert.match(notices, /<title>Notices · Fremont Derby/);
  assert.match(notices, /<h1[^>]*>Notices</);
});

test('notices page says conversations stay in messages', () => {
  assert.match(notices, /Conversations stay in/);
  assert.match(notices, /href="\/messages"/);
});

test('notices page offers mark all read and reload', () => {
  assert.match(notices, /Mark all read/);
  assert.match(notices, /Reload notices/);
});

test('notices page links to the schedule', () => {
  assert.match(notices, /href="\/schedule"/);
});

test('notices page shows a loading state', () => {
  assert.match(notices, /Loading notices/);
});

test('free agents page is titled Free agents', () => {
  assert.match(freeAgents, /<title>Free agents · Fremont Derby/);
  assert.match(freeAgents, /Free agents/);
});

test('free agents page offers join, profile, dates, schedule, and teams', () => {
  assert.match(freeAgents, /Join the season/);
  assert.match(freeAgents, /Open Profile/);
  assert.match(freeAgents, /Mark your dates/);
  assert.match(freeAgents, /Open Schedule/);
  assert.match(freeAgents, /Find a team/);
  assert.match(freeAgents, /Browse Teams/);
});

test('free agents page links to schedule, standings, messages, and teams', () => {
  assert.match(freeAgents, /href="\/schedule"/);
  assert.match(freeAgents, /href="\/standings"/);
  assert.match(freeAgents, /href="\/messages"/);
  assert.match(freeAgents, /href="\/teams"/);
});

test('free agents page says when an action could not be completed', () => {
  assert.match(freeAgents, /We could not complete that action/);
  assert.match(freeAgents, /Action needed/);
});

test('free agents page shows a loading state for the message preview', () => {
  assert.match(freeAgents, /Loading message preview/);
  assert.match(freeAgents, /View all messages/);
});
