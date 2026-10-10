import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderScorecardPage } from '../src/scorecardPage.js';
import { renderLineupPage } from '../src/lineupPage.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderAdminGatewayPage } from '../src/adminGatewayPage.js';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import { renderProfilePage } from '../src/profilePage.js';
import { renderChatPage } from '../src/chatPage.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderAvailabilityPage } from '../src/availabilityPage.js';
import { renderSeasonSetupPage } from '../src/seasonSetupPage.js';
import { renderIntroPage, renderRulesPage } from '../src/publicPages.js';
import { renderDemoSeasonPage } from '../src/demoSeasonPage.js';
import { renderJflNotFoundPage } from '../src/jflNotFoundPage.js';
import { renderJflFreeAgentsPage } from '../src/jflFreeAgentsPage.js';
import { renderJflNotificationsPage } from '../src/jflNotificationsPage.js';
import { renderTradesPage } from '../src/tradesPage.js';
import { renderPrizesPage } from '../src/prizesPage.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

const pages = {
  schedule: renderSchedulePage(),
  scorecard: renderScorecardPage(),
  lineup: renderLineupPage(),
  standings: renderStandingsPage(),
  admin: renderAdminGatewayPage(),
  operations: renderAdminOperationsPage(),
  players: renderAdminPlayersPage(),
  profile: renderProfilePage(),
  messages: renderChatPage(),
  teams: renderTeamsPage(),
  checkin: renderAvailabilityPage(),
  setup: renderSeasonSetupPage(),
  welcome: renderIntroPage(),
  rules: renderRulesPage(),
  demo: renderDemoSeasonPage(),
  missing: renderJflNotFoundPage(),
  freeAgents: renderJflFreeAgentsPage(),
  notices: renderJflNotificationsPage(),
  trades: renderTradesPage(),
  prizes: renderPrizesPage(),
  picker: renderScorePickerPage(),
};

for (const [name, html] of Object.entries(pages)) {
  test(`${name} page declares English`, () => {
    assert.match(html, /<html[^>]*lang="en"/);
  });

  test(`${name} page has a title that names Fremont Derby`, () => {
    assert.match(html, /<title>[^<]*Fremont Derby/);
  });

  test(`${name} page has a main landmark`, () => {
    assert.match(html, /<main[\s>]/);
  });

  test(`${name} page has a heading or a page title`, () => {
    const hasHeading = /<h[1-2][\s>]/.test(html);
    const hasTitle = /<title>[^<]+<\/title>/.test(html);
    assert.ok(hasHeading || hasTitle, `${name} has neither a heading nor a title`);
  });
}

test('admin home links cover the five admin tasks', () => {
  const admin = pages.admin;
  for (const href of ['/admin/operations', '/admin/players', '/admin/seasons', '/admin/season-teams', '/season-setup']) {
    assert.match(admin, new RegExp(`href="${href}"`));
  }
});

test('teams page links cover the night-of-play actions', () => {
  const teams = pages.teams;
  for (const href of ['/lineup', '/availability', '/scorecard', '/messages', '/trades']) {
    assert.match(teams, new RegExp(`href="${href}"`));
  }
});

test('scorecard page links cover schedule and profile', () => {
  assert.match(pages.scorecard, /href="\/schedule"/);
  assert.match(pages.scorecard, /href="\/profile"/);
});

test('welcome page links cover profile, demo, and rules', () => {
  assert.match(pages.welcome, /href="\/profile"/);
  assert.match(pages.welcome, /href="\/demo"/);
  assert.match(pages.welcome, /href="\/rules"/);
});

test('missing page links cover home, schedule, and standings', () => {
  assert.match(pages.missing, /href="\/"/);
  assert.match(pages.missing, /href="\/schedule"/);
  assert.match(pages.missing, /href="\/standings"/);
});

test('free agents page links cover schedule, standings, and teams', () => {
  assert.match(pages.freeAgents, /href="\/schedule"/);
  assert.match(pages.freeAgents, /href="\/standings"/);
  assert.match(pages.freeAgents, /href="\/teams"/);
});

test('notices page links cover messages and schedule', () => {
  assert.match(pages.notices, /href="\/messages"/);
  assert.match(pages.notices, /href="\/schedule"/);
});

test('prizes page links to the rules', () => {
  assert.match(pages.prizes, /href="\/rules"/);
});

test('demo page links cover both sandboxes', () => {
  assert.match(pages.demo, /href="\/sandbox\/captain"/);
  assert.match(pages.demo, /href="\/sandbox\/player"/);
});

test('messages page links to moderation', () => {
  assert.match(pages.messages, /href="\/messages\/moderation"/);
});

test('profile page links cover the admin tools an owner needs', () => {
  for (const href of ['/admin/players', '/admin/operations', '/season-setup', '/messages/moderation']) {
    assert.match(pages.profile, new RegExp(`href="${href}"`));
  }
});
