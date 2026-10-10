import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAdminGatewayPage } from '../src/adminGatewayPage.js';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import { renderAdminSeasonsPage } from '../src/adminSeasonsPage.js';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';
import { renderSeasonSetupPage } from '../src/seasonSetupPage.js';
import { renderChatModerationPage } from '../src/chatModerationPage.js';

const admin = renderAdminGatewayPage();
const ops = renderAdminOperationsPage();
const players = renderAdminPlayersPage();
const seasons = renderAdminSeasonsPage();
const seasonTeams = renderAdminSeasonTeamsPage();
const setup = renderSeasonSetupPage();
const moderation = renderChatModerationPage();

test('admin home is titled Admin', () => {
  assert.match(admin, /<title>Admin · Fremont Derby/);
  assert.match(admin, /<h1[^>]*>Admin</);
});

test('admin home tells the user only usable tools appear', () => {
  assert.match(admin, /Choose the league task you need/);
  assert.match(admin, /Only tools you can use will appear/);
});

test('admin home shows a checking-access state', () => {
  assert.match(admin, /Checking your access/);
  assert.match(admin, /right admin options for your account/);
});

test('admin home links to operations', () => {
  assert.match(admin, /href="\/admin\/operations"/);
  assert.match(admin, /Open operations/);
  assert.match(admin, /See what needs attention before league night/);
});

test('admin home links to players', () => {
  assert.match(admin, /href="\/admin\/players"/);
  assert.match(admin, /Manage players/);
  assert.match(admin, /eligibility, and roster exceptions/);
});

test('admin home links to seasons', () => {
  assert.match(admin, /href="\/admin\/seasons"/);
  assert.match(admin, /Browse seasons/);
});

test('admin home links to season teams', () => {
  assert.match(admin, /href="\/admin\/season-teams"/);
  assert.match(admin, /Manage teams/);
  assert.match(admin, /manage slots for a season/);
});

test('admin home links to season setup', () => {
  assert.match(admin, /href="\/season-setup"/);
  assert.match(admin, /Open setup/);
  assert.match(admin, /Create and publish seasons/);
});

test('admin home links to moderation and messages', () => {
  assert.match(admin, /href="\/messages\/moderation"/);
  assert.match(admin, /Review reports/);
  assert.match(admin, /href="\/messages"/);
  assert.match(admin, /Open messages/);
});

test('admin home links to the profile', () => {
  assert.match(admin, /href="\/profile"/);
});

test('admin home asks the user to sign in to continue', () => {
  assert.match(admin, /Sign in to continue/);
});

test('operations page is titled League operations', () => {
  assert.match(ops, /<title>League operations · Fremont Derby/);
  assert.match(ops, /League operations/);
});

test('operations page asks if the league is running smoothly', () => {
  assert.match(ops, /Is Fremont Derby running smoothly/);
});

test('operations page links to players, season setup, and moderation', () => {
  assert.match(ops, /href="\/admin\/players"/);
  assert.match(ops, /href="\/season-setup"/);
  assert.match(ops, /href="\/messages\/moderation"/);
});

test('operations page shows league health loading and needs-attention', () => {
  assert.match(ops, /Loading league health/);
  assert.match(ops, /Needs attention/);
});

test('operations page names league night, communication, and ratings', () => {
  assert.match(ops, /League night/);
  assert.match(ops, /Communication/);
  assert.match(ops, /Ratings and system/);
});

test('players page is titled Player Management', () => {
  assert.match(players, /<title>Player Management · Fremont Derby/);
  assert.match(players, />Players</);
});

test('players page offers create and find', () => {
  assert.match(players, /Create player/);
  assert.match(players, /Find by player or team name/);
  assert.match(players, /Player name/);
});

test('players page says when no players match the search', () => {
  assert.match(players, /No players match that search/);
});

test('players page shows a checking-admin-access state', () => {
  assert.match(players, /Checking admin access/);
});

test('players page links back to operations', () => {
  assert.match(players, /href="\/admin\/operations"/);
  assert.match(players, /Operations/);
});

test('seasons page is titled Seasons', () => {
  assert.match(seasons, /<title>Seasons · Fremont Derby Admin/);
  assert.match(seasons, />Seasons</);
});

test('seasons page offers a way to find a season', () => {
  assert.match(seasons, /Find a season/);
  assert.match(seasons, /All statuses/);
});

test('seasons page names registration and playoffs as filters', () => {
  assert.match(seasons, /Registration/);
  assert.match(seasons, /Playoffs/);
});

test('seasons page links back to admin home', () => {
  assert.match(seasons, /href="\/admin"/);
  assert.match(seasons, /Admin home/);
});

test('season teams page is titled Season teams', () => {
  assert.match(seasonTeams, /<title>Fremont Derby · Season teams/);
  assert.match(seasonTeams, /Season teams/);
});

test('season teams page explains returning teams and new teams', () => {
  assert.match(seasonTeams, /Reserve returning teams and add qualified new teams/);
});

test('season teams page offers find and create', () => {
  assert.match(seasonTeams, /Find a team/);
  assert.match(seasonTeams, /New team name/);
  assert.match(seasonTeams, /Create team/);
});

test('season teams page shows loading for seasons and slots', () => {
  assert.match(seasonTeams, /Loading seasons/);
  assert.match(seasonTeams, /Loading team slots/);
});

test('season teams page says sign-in is required', () => {
  assert.match(seasonTeams, /Sign in required/);
});

test('season teams page links to season setup, players, and operations', () => {
  assert.match(seasonTeams, /href="\/season-setup"/);
  assert.match(seasonTeams, /href="\/admin\/players"/);
  assert.match(seasonTeams, /href="\/admin\/operations"/);
});

test('season setup page is titled Season Setup', () => {
  assert.match(setup, /<title>Fremont Derby Season Setup/);
});

test('season setup page offers a season name and a league night', () => {
  assert.match(setup, /Season name/);
  assert.match(setup, /League night/);
});

test('season setup page offers first round and roster lock round', () => {
  assert.match(setup, /First round/);
  assert.match(setup, /Roster lock round/);
});

test('season setup page offers prize, playoff, and capacity fields', () => {
  assert.match(setup, /Prize match minimum/);
  assert.match(setup, /Playoff teams/);
  assert.match(setup, /Team capacity/);
  assert.match(setup, /Committed players needed/);
});

test('season setup page offers championship tiebreaker and anchor match', () => {
  assert.match(setup, /Championship tiebreaker/);
  assert.match(setup, /Anchor match/);
});

test('season setup page offers save, publish, and reload', () => {
  assert.match(setup, /Save setup/);
  assert.match(setup, /Publish schedule/);
  assert.match(setup, /Reload current/);
});

test('season setup page offers a retry and a sign-in path', () => {
  assert.match(setup, /Retry season list/);
  assert.match(setup, /Sign in with Google/);
});

test('season setup page says when no teams are loaded', () => {
  assert.match(setup, /No teams loaded/);
});

test('moderation page is titled Chat moderation', () => {
  assert.match(moderation, /<title>Chat moderation · Fremont Derby/);
  assert.match(moderation, /Chat moderation/);
});

test('moderation page explains it reviews reports across every chat type', () => {
  assert.match(moderation, /Review player reports across every chat type/);
});

test('moderation page links back to messages', () => {
  assert.match(moderation, /href="\/messages"/);
  assert.match(moderation, /Back to messages/);
});

test('moderation page shows a loading state for reports', () => {
  assert.match(moderation, /Loading reports/);
});
