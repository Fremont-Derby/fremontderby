import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderScorecardPage } from '../src/scorecardPage.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';
import { renderLineupPage } from '../src/lineupPage.js';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

const schedule = renderSchedulePage();
const scorecard = renderScorecardPage();
const picker = renderScorePickerPage();
const lineup = renderLineupPage();
const checkin = renderAvailabilityPage();

test('schedule page is titled for the league', () => {
  assert.match(schedule, /<title>Fremont Derby Schedule/);
});

test('schedule page tells the user when no schedule is published', () => {
  assert.match(schedule, /No schedule has been published for this season yet/);
});

test('schedule page offers a way to choose a season', () => {
  assert.match(schedule, /Choose a season/);
});

test('schedule page links to standings', () => {
  assert.match(schedule, /href="\/standings"/);
  assert.match(schedule, /View standings/);
});

test('schedule page names the next league night', () => {
  assert.match(schedule, /Next league night/);
  assert.match(schedule, /League night/);
});

test('schedule page shows a loading state while seasons load', () => {
  assert.match(schedule, /Loading seasons/);
});

test('score picker page invites the user to score a match', () => {
  assert.match(picker, /<title>Score a Match/);
  assert.match(picker, /Score a match/);
});

test('score picker page shows a loading state for the match list', () => {
  assert.match(picker, /Loading your matches/);
});

test('scorecard page is titled as the scorecard', () => {
  assert.match(scorecard, /<title>Fremont Derby Scorecard/);
});

test('scorecard page offers a way back to the score picker', () => {
  assert.match(scorecard, /Back to Score picker/);
});

test('scorecard page offers a way to switch the match', () => {
  assert.match(scorecard, /Switch match/);
});

test('scorecard page offers a way to view the schedule', () => {
  assert.match(scorecard, /View schedule/);
  assert.match(scorecard, /href="\/schedule"/);
});

test('scorecard page says when the scorecard is unavailable', () => {
  assert.match(scorecard, /Scorecard unavailable/);
  assert.match(scorecard, /Try again/);
});

test('scorecard page shows the running team score', () => {
  assert.match(scorecard, /Running team score/);
});

test('scorecard page shows the current individual race', () => {
  assert.match(scorecard, /Current individual race/);
  assert.match(scorecard, /Race to/);
});

test('scorecard page lets a captain add a rack', () => {
  assert.match(scorecard, /Add Rack/);
});

test('scorecard page lets a captain mark who won the rack', () => {
  assert.match(scorecard, /Player A wins/);
  assert.match(scorecard, /Player B wins/);
});

test('scorecard page lets a captain edit or undo a rack', () => {
  assert.match(scorecard, /Edit Rack/);
  assert.match(scorecard, /Undo Last Rack/);
});

test('scorecard page tells the captain they only change their own submission', () => {
  assert.match(scorecard, /Change only your team/);
  assert.match(scorecard, /Your submission/);
  assert.match(scorecard, /Other team/);
});

test('scorecard page offers confirm and finalize', () => {
  assert.match(scorecard, /Confirm this side/);
  assert.match(scorecard, /Finalize match/);
});

test('scorecard page offers a way to open the profile to sign in', () => {
  assert.match(scorecard, /Open Profile to sign in/);
  assert.match(scorecard, /href="\/profile"/);
});

test('scorecard page shows a loading state for the round and match', () => {
  assert.match(scorecard, /Loading round and match/);
});

test('lineup page is titled for the captain lineup', () => {
  assert.match(lineup, /<title>Fremont Derby Lineup/);
  assert.match(lineup, /Captain lineup/);
  assert.match(lineup, /Set your lineup/);
});

test('lineup page tells the captain to choose a team first', () => {
  assert.match(lineup, /Choose a team first/);
});

test('lineup page tells the captain to choose the week', () => {
  assert.match(lineup, /Choose the week you are setting a lineup for/);
});

test('lineup page shows the opponent and whether they have submitted', () => {
  assert.match(lineup, /Opponent team/);
  assert.match(lineup, /Waiting for their captain/);
  assert.match(lineup, /Not submitted/);
});

test('lineup page offers submit and unlock', () => {
  assert.match(lineup, /Submit lineup/);
  assert.match(lineup, /Unlock lineup/);
});

test('lineup page offers a way to find a sub', () => {
  assert.match(lineup, /Find a sub/);
  assert.match(lineup, /My roster/);
});

test('lineup page links to the scorecard so the captain can score the matches', () => {
  assert.match(lineup, /Score the three matches/);
  assert.match(lineup, /href="\/scorecard"/);
});

test('lineup page offers a sign-in path and a retry', () => {
  assert.match(lineup, /Sign in/);
  assert.match(lineup, /Try again/);
  assert.match(lineup, /Checking your captain access/);
});

test('check-in page is titled for availability', () => {
  assert.match(checkin, /<title>Fremont Derby Availability/);
  assert.match(checkin, /Check in/);
});

test('check-in page tells the player to choose a team', () => {
  assert.match(checkin, /Choose your team/);
});

test('check-in page says a team choice is required before lineups', () => {
  assert.match(checkin, /Required before lineups/);
});

test('check-in page says when no upcoming rounds are available', () => {
  assert.match(checkin, /No upcoming published regular-season rounds are available/);
});

test('check-in page shows a loading state while nights load', () => {
  assert.match(checkin, /Loading your league nights/);
  assert.match(checkin, /Checking your sign-in and upcoming rounds/);
});
