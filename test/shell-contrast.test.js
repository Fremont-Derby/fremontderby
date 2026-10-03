import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the menu contrast can be named', () => {
  const src = readFileSync(new URL('../src/shellContrast.js', import.meta.url), 'utf8');
  assert.match(src, /function shellContrastLabel/);
  assert.match(src, /Menu contrast needs a check/);
});

test("a profile can name its status", () => {
  const src = readFileSync(new URL("../src/profileStatus.js", import.meta.url), "utf8");
  assert.match(src, /function profileStatusLabel/);
  assert.match(src, /Profile needs a status/);
});

test("a player rating can be named", () => {
  const src = readFileSync(new URL("../src/ratingStatus.js", import.meta.url), "utf8");
  assert.match(src, /function ratingStatusLabel/);
  assert.match(src, /Rating is missing/);
});

test("a profile can name a missing phone", () => {
  const src = readFileSync(new URL("../src/phoneStatus.js", import.meta.url), "utf8");
  assert.match(src, /function phoneStatusLabel/);
  assert.match(src, /Phone is missing/);
});

test("a profile can name a missing phone", () => {
  const src = readFileSync(new URL("../src/phoneStatus.js", import.meta.url), "utf8");
  assert.match(src, /function phoneStatusLabel/);
  assert.match(src, /Phone is missing/);
});

test("a profile can name a missing phone", () => {
  const src = readFileSync(new URL("../src/phoneStatus.js", import.meta.url), "utf8");
  assert.match(src, /function phoneStatusLabel/);
  assert.match(src, /Phone is missing/);
});

test("a team can name a missing captain", () => {
  const src = readFileSync(new URL("../src/captainStatus.js", import.meta.url), "utf8");
  assert.match(src, /function captainStatusLabel/);
  assert.match(src, /Captain is missing/);
});

test("a team can name an empty roster", () => {
  const src = readFileSync(new URL("../src/rosterStatus.js", import.meta.url), "utf8");
  assert.match(src, /function rosterStatusLabel/);
  assert.match(src, /Roster is empty/);
});

test("a match can name a missing table", () => {
  const src = readFileSync(new URL("../src/tableStatus.js", import.meta.url), "utf8");
  assert.match(src, /function tableStatusLabel/);
  assert.match(src, /Table is not set/);
});

test("a schedule can name a missing round", () => {
  const src = readFileSync(new URL("../src/roundStatus.js", import.meta.url), "utf8");
  assert.match(src, /function roundStatusLabel/);
  assert.match(src, /Round is not set/);
});

test("a match can name a missing date", () => {
  const src = readFileSync(new URL("../src/dateStatus.js", import.meta.url), "utf8");
  assert.match(src, /function dateStatusLabel/);
  assert.match(src, /Date is not set/);
});

test("a match can name a missing makeup date", () => {
  const src = readFileSync(new URL("../src/makeupStatus.js", import.meta.url), "utf8");
  assert.match(src, /function makeupStatusLabel/);
  assert.match(src, /No makeup date/);
});

test("a match can name an unscored state", () => {
  const src = readFileSync(new URL("../src/scoreStateLabel.js", import.meta.url), "utf8");
  assert.match(src, /function scoreStateLabel/);
  assert.match(src, /Not scored/);
});

test("a lineup can name its lock", () => {
  const src = readFileSync(new URL("../src/lineupLock.js", import.meta.url), "utf8");
  assert.match(src, /function lineupLockLabel/);
  assert.match(src, /Lineup still open/);
});

test("a player can name a missing check-in", () => {
  const src = readFileSync(new URL("../src/checkInLabel.js", import.meta.url), "utf8");
  assert.match(src, /function checkInLabel/);
  assert.match(src, /Not checked in/);
});

test("a message can name a missing matchup thread", () => {
  const src = readFileSync(new URL("../src/messageThread.js", import.meta.url), "utf8");
  assert.match(src, /function messageThreadLabel/);
  assert.match(src, /No matchup thread/);
});

test("standings can name a missing place", () => {
  const src = readFileSync(new URL("../src/placeStatus.js", import.meta.url), "utf8");
  assert.match(src, /function placeStatusLabel/);
  assert.match(src, /Place is not set/);
});

test("a team can name missing points", () => {
  const src = readFileSync(new URL("../src/pointsStatus.js", import.meta.url), "utf8");
  assert.match(src, /function pointsStatusLabel/);
  assert.match(src, /Points are missing/);
});

test("a team can name a missing playoff spot", () => {
  const src = readFileSync(new URL("../src/playoffStatus.js", import.meta.url), "utf8");
  assert.match(src, /function playoffStatusLabel/);
  assert.match(src, /Not in the playoffs/);
});

test("a player can name a missing waitlist spot", () => {
  const src = readFileSync(new URL("../src/waitlistStatus.js", import.meta.url), "utf8");
  assert.match(src, /function waitlistStatusLabel/);
  assert.match(src, /Not on the waitlist/);
});

test("a team can name a missing entry", () => {
  const src = readFileSync(new URL("../src/entryStatus.js", import.meta.url), "utf8");
  assert.match(src, /function entryStatusLabel/);
  assert.match(src, /Not entered/);
});

test("a team can name a missing payment", () => {
  const src = readFileSync(new URL("../src/paymentStatus.js", import.meta.url), "utf8");
  assert.match(src, /function paymentStatusLabel/);
  assert.match(src, /Not paid/);
});

test("a player can name unfinished trial nights", () => {
  const src = readFileSync(new URL("../src/trialNight.js", import.meta.url), "utf8");
  assert.match(src, /function trialNightLabel/);
  assert.match(src, /trial nights/);
});

test("a season can name a missing start date", () => {
  const src = readFileSync(new URL("../src/seasonDate.js", import.meta.url), "utf8");
  assert.match(src, /function seasonDateLabel/);
  assert.match(src, /Season date is not set/);
});

test("a season can name a missing blackout", () => {
  const src = readFileSync(new URL("../src/blackoutDate.js", import.meta.url), "utf8");
  assert.match(src, /function blackoutDateLabel/);
  assert.match(src, /No blackout date/);
});

test("a season can name a missing venue", () => {
  const src = readFileSync(new URL("../src/venueStatus.js", import.meta.url), "utf8");
  assert.match(src, /function venueStatusLabel/);
  assert.match(src, /Venue is not set/);
});

test("a season can name a missing table count", () => {
  const src = readFileSync(new URL("../src/tableCount.js", import.meta.url), "utf8");
  assert.match(src, /function tableCountLabel/);
  assert.match(src, /Table count is not set/);
});

test("a season can name a missing play night", () => {
  const src = readFileSync(new URL("../src/nightStatus.js", import.meta.url), "utf8");
  assert.match(src, /function nightStatusLabel/);
  assert.match(src, /Play night is not set/);
});

test("a season can name a missing cost", () => {
  const src = readFileSync(new URL("../src/costStatus.js", import.meta.url), "utf8");
  assert.match(src, /function costStatusLabel/);
  assert.match(src, /Cost is not set/);
});

test("a season can name a closed join", () => {
  const src = readFileSync(new URL("../src/joinStatus.js", import.meta.url), "utf8");
  assert.match(src, /function joinStatusLabel/);
  assert.match(src, /Join is closed/);
});
