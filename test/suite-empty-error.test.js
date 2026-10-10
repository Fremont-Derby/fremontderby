import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderScorecardPage } from '../src/scorecardPage.js';
import { renderLineupPage } from '../src/lineupPage.js';
import { renderAvailabilityPage } from '../src/availabilityPage.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderTradesPage } from '../src/tradesPage.js';
import { renderPrizesPage } from '../src/prizesPage.js';
import { renderChatPage } from '../src/chatPage.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';
import { renderSeasonSetupPage } from '../src/seasonSetupPage.js';
import { renderProfilePage } from '../src/profilePage.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';
import { renderJflFreeAgentsPage } from '../src/jflFreeAgentsPage.js';
import { renderJflNotificationsPage } from '../src/jflNotificationsPage.js';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';
import { renderChatModerationPage } from '../src/chatModerationPage.js';

test('schedule says when nothing is published', () => {
  assert.match(renderSchedulePage(), /No schedule has been published for this season yet/);
});

test('scorecard says when it cannot load', () => {
  assert.match(renderScorecardPage(), /Scorecard unavailable/);
});

test('scorecard offers a retry when it cannot load', () => {
  assert.match(renderScorecardPage(), /Try again/);
});

test('lineup says when the captain has not chosen a team', () => {
  assert.match(renderLineupPage(), /Choose a team first/);
});

test('lineup says when the opponent has not submitted', () => {
  assert.match(renderLineupPage(), /Waiting for their captain/);
});

test('check-in says when no rounds are available', () => {
  assert.match(renderAvailabilityPage(), /No upcoming published regular-season rounds are available/);
});

test('standings says while standings are still loading', () => {
  assert.match(renderStandingsPage(), /Standings are loading/);
});

test('teams says while the matchup is still being found', () => {
  assert.match(renderTeamsPage(), /Finding your matchup/);
});

test('trades says when none are loaded', () => {
  assert.match(renderTradesPage(), /No trades loaded/);
});

test('prizes says when no projected payouts are loaded', () => {
  assert.match(renderPrizesPage(), /No projected payouts loaded/);
});

test('prizes says when no finalized payouts are loaded', () => {
  assert.match(renderPrizesPage(), /No finalized payouts loaded/);
});

test('messages says when they are unavailable', () => {
  assert.match(renderChatPage(), /Messages unavailable/);
});

test('messages says when there is nobody to message', () => {
  assert.match(renderChatPage(), /No other registered players are available to message yet/);
});

test('player search says when nothing matches', () => {
  assert.match(renderAdminPlayersPage(), /No players match that search/);
});

test('season teams says sign-in is required', () => {
  assert.match(renderAdminSeasonTeamsPage(), /Sign in required/);
});

test('season setup says when no teams are loaded', () => {
  assert.match(renderSeasonSetupPage(), /No teams loaded/);
});

test('profile says when the user is signed out', () => {
  assert.match(renderProfilePage(), /Signed out/);
});

test('profile says when the player is not rated', () => {
  assert.match(renderProfilePage(), /Not rated/);
});

test('score picker says while matches load', () => {
  assert.match(renderScorePickerPage(), /Loading your matches/);
});

test('free agents says when an action fails', () => {
  assert.match(renderJflFreeAgentsPage(), /We could not complete that action/);
});

test('notices says while they load', () => {
  assert.match(renderJflNotificationsPage(), /Loading notices/);
});

test('operations says while league health loads', () => {
  assert.match(renderAdminOperationsPage(), /Loading league health/);
});

test('moderation says while reports load', () => {
  assert.match(renderChatModerationPage(), /Loading reports/);
});

test('lineup says the selection is still editable before submit', () => {
  assert.match(renderLineupPage(), /Not submitted · editable/);
  assert.match(renderLineupPage(), /Your selections can still be changed/);
});

test('scorecard tells the captain the other team submission is separate', () => {
  assert.match(renderScorecardPage(), /Other team/);
  assert.match(renderScorecardPage(), /Your submission/);
});
