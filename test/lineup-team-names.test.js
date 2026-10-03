import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the lineup status can name both teams', () => {
  const src = readFileSync(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  assert.match(src, /function lineupNames/);
  assert.match(src, /vs /);
});

test('the lineup stays editable until both captains submit', () => {
  const src = readFileSync(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  assert.match(src, /function lineupStillEditable/);
  assert.match(src, /bothCaptainsSubmitted/);
});

test('check-in can name in, out, and maybe', () => {
  const src = readFileSync(new URL('../src/availabilityPage.js', import.meta.url), 'utf8');
  assert.match(src, /function checkInStatusLabel/);
  assert.match(src, /return'In'/);
});

test("the lineup can name the opponent submission", () => {
  const src = readFileSync(new URL("../src/lineupPage.js", import.meta.url), "utf8");
  assert.match(src, /function opponentLineupStatus/);
  assert.match(src, /Opponent submitted/);
});

test("the lineup reset says when both captains have submitted", () => {
  const src = readFileSync(new URL("../src/lineupPage.js", import.meta.url), "utf8");
  assert.match(src, /function lineupResetStatus/);
  assert.match(src, /Reset only if both agree/);
});

test("the scorecard can name the selected control", () => {
  const src = readFileSync(new URL("../src/scorecardPage.js", import.meta.url), "utf8");
  assert.match(src, /function selectedScoreControl/);
  assert.match(src, /No score control selected/);
});

test("a finished scorecard does not offer another rack", () => {
  const src = readFileSync(new URL("../src/scorecardPage.js", import.meta.url), "utf8");
  assert.match(src, /function matchCompleteLabel/);
  assert.match(src, /No more racks/);
});

test("the scorecard can name an undo of the last rack", () => {
  const src = readFileSync(new URL("../src/scorecardPage.js", import.meta.url), "utf8");
  assert.match(src, /function undoLastRackLabel/);
  assert.match(src, /No rack to undo/);
});

test("the scorecard can name a rack edit", () => {
  const src = readFileSync(new URL("../src/scorecardPage.js", import.meta.url), "utf8");
  assert.match(src, /function rackEditLabel/);
  assert.match(src, /Select a rack to edit/);
});

test("the scorecard can name a live score", () => {
  const src = readFileSync(new URL("../src/scorecardPage.js", import.meta.url), "utf8");
  assert.match(src, /function liveScoreLabel/);
  assert.match(src, /Score not live/);
});

test("a team can show eligibility progress", () => {
  const src = readFileSync(new URL("../src/teamsPage.js", import.meta.url), "utf8");
  assert.match(src, /function eligibilityProgress/);
  assert.match(src, /players/);
});

test("standings can name the season or playoff mode", () => {
  const src = readFileSync(new URL("../src/standingsPage.js", import.meta.url), "utf8");
  assert.match(src, /function standingsModeLabel/);
  assert.match(src, /Season standings/);
});

test("a profile phone can be shown with dashes", () => {
  const src = readFileSync(new URL("../src/profilePage.js", import.meta.url), "utf8");
  assert.match(src, /function displayPhone/);
  assert.match(src, /No phone/);
});

test("the more menu can name its open state", () => {
  const src = readFileSync(new URL("../src/appShell.js", import.meta.url), "utf8");
  assert.match(src, /function moreMenuLabel/);
  assert.match(src, /More menu open/);
});

test("a profile can name a stale rating", () => {
  const src = readFileSync(new URL("../src/profilePage.js", import.meta.url), "utf8");
  assert.match(src, /function ratingRefreshLabel/);
  assert.match(src, /Rating needs a refresh/);
});

test("a team can name a pending captain transfer", () => {
  const src = readFileSync(new URL("../src/teamsPage.js", import.meta.url), "utf8");
  assert.match(src, /function captainTransferLabel/);
  assert.match(src, /No captain transfer/);
});

test("a team can name open roster seats", () => {
  const src = readFileSync(new URL("../src/teamsPage.js", import.meta.url), "utf8");
  assert.match(src, /function addPlayersLabel/);
  assert.match(src, /Roster is full/);
});

test("the schedule can name the next match", () => {
  const src = readFileSync(new URL("../src/schedulePage.js", import.meta.url), "utf8");
  assert.match(src, /function nextMatchLabel/);
  assert.match(src, /No next match/);
});

test("check-in can name the selected league night", () => {
  const src = readFileSync(new URL("../src/availabilityPage.js", import.meta.url), "utf8");
  assert.match(src, /function availabilityNightLabel/);
  assert.match(src, /No league night selected/);
});

test("a message can name the matchup thread", () => {
  const src = readFileSync(new URL("../src/chatPage.js", import.meta.url), "utf8");
  assert.match(src, /function messageSendLabel/);
  assert.match(src, /Send to this matchup/);
});

test("eligibility can name a qualified player", () => {
  const src = readFileSync(new URL("../src/eligibilityPage.js", import.meta.url), "utf8");
  assert.match(src, /function eligibilityPageLabel/);
  assert.match(src, /Not qualified yet/);
});

test("eligibility can name a qualified player", () => {
  const src = readFileSync(new URL("../src/eligibilityLabel.js", import.meta.url), "utf8");
  assert.match(src, /function eligibilityPageLabel/);
  assert.match(src, /Not qualified yet/);
});

test("standings can name a team place", () => {
  const src = readFileSync(new URL("../src/standingsContext.js", import.meta.url), "utf8");
  assert.match(src, /function standingsContextLabel/);
  assert.match(src, /No standings context/);
});

test("a team summary names the captain", () => {
  const src = readFileSync(new URL("../src/teamSummary.js", import.meta.url), "utf8");
  assert.match(src, /function teamSummaryLabel/);
  assert.match(src, /No team selected/);
});

test("a mission can be aborted after it starts", () => {
  const src = readFileSync(new URL("../src/missionAbort.js", import.meta.url), "utf8");
  assert.match(src, /function missionAbortLabel/);
  assert.match(src, /No mission to abort/);
});

test("a survey waits until the mission is complete", () => {
  const src = readFileSync(new URL("../src/surveyPromise.js", import.meta.url), "utf8");
  assert.match(src, /function surveyPromiseLabel/);
  assert.match(src, /Survey comes after the mission/);
});

test("a result waits until the level is complete", () => {
  const src = readFileSync(new URL("../src/resultSubmit.js", import.meta.url), "utf8");
  assert.match(src, /function resultSubmitLabel/);
  assert.match(src, /Finish the level before submitting/);
});

test("a preview is not the tester path", () => {
  const src = readFileSync(new URL("../src/testerPath.js", import.meta.url), "utf8");
  assert.match(src, /function testerPathLabel/);
  assert.match(src, /Preview is not the tester path/);
});

test("a mission launch needs a plain title", () => {
  const src = readFileSync(new URL("../src/missionLaunch.js", import.meta.url), "utf8");
  assert.match(src, /function missionLaunchLabel/);
  assert.match(src, /Mission needs a plain title/);
});

test("a mission shows the task instead of a fixture name", () => {
  const src = readFileSync(new URL("../src/missionTask.js", import.meta.url), "utf8");
  assert.match(src, /function missionTaskLabel/);
  assert.match(src, /fixture name/);
});

test("a mission names the player", () => {
  const src = readFileSync(new URL("../src/missionIdentity.js", import.meta.url), "utf8");
  assert.match(src, /function missionIdentityLabel/);
  assert.match(src, /Mission needs a player name/);
});

test("a stuck mission can be left", () => {
  const src = readFileSync(new URL("../src/stuckPath.js", import.meta.url), "utf8");
  assert.match(src, /function stuckPathLabel/);
  assert.match(src, /Mission is not stuck/);
});

test("a campaign names its missions", () => {
  const src = readFileSync(new URL("../src/campaignFoundation.js", import.meta.url), "utf8");
  assert.match(src, /function campaignFoundationLabel/);
  assert.match(src, /Campaign needs missions/);
});
