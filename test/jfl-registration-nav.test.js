import assert from 'node:assert/strict';
import test from 'node:test';
import {
  injectJflRegistrationCheckin,
  injectJflRegistrationHome,
  injectJflRegistrationNav,
  injectJflRegistrationProfile,
  injectJflRegistrationSchedule,
  injectJflRegistrationTeams,
} from '../src/jflRegistrationNav.js';
import { routeJflSeasonPublicReads } from '../src/jflSeasonPublicReadsHttp.js';
import { routeJflSeasonSchedule } from '../src/jflSeasonScheduleHttp.js';
import worker from '../src/personaRouterEntry.js';

test('registration destinations are inserted before Standings in the more menu', () => {
  const html = injectJflRegistrationNav('<a href="/standings" data-nav-key="standings">Standings</a>');
  assert.match(html, /data-nav-key="free-agents"/);
  assert.match(html, /data-nav-key="practice"/);
  assert.match(html, /data-nav-key="playoffs"/);
  assert.match(html, /data-nav-key="notifications"/);
  assert.doesNotMatch(html, /data-nav-key="trades"/);
  assert.ok(html.indexOf('practice') < html.indexOf('standings'));
});

test('registration shortcuts land on the modern home header', () => {
  const html = injectJflRegistrationHome('<main class="fd-home" data-fd-modern-home="true"><header></header></main>');
  assert.match(html, /data-fd-registration-links/);
  assert.match(html, /href="\/free-agents"/);
  assert.match(html, /href="\/practice"/);
  assert.match(html, /href="\/availability"/);
});

test('registration callout lands on modern Teams', () => {
  const html = injectJflRegistrationTeams('<main class="fd-teams" data-fd-modern-teams="true"><header><h1>Teams</h1></header></main>');
  assert.match(html, /data-fd-registration-teams/);
  assert.match(html, /href="\/free-agents"/);
  assert.match(html, /free agent/i);
});

test('registration callout lands on modern Schedule', () => {
  const html = injectJflRegistrationSchedule('<main class="fd-schedule" data-fd-modern-schedule="true"><header><h1>Schedule</h1></header></main>');
  assert.match(html, /data-fd-registration-schedule/);
  assert.match(html, /href="\/practice"/);
});

test('registration callout lands on Check in', () => {
  const html = injectJflRegistrationCheckin('<main class="app"><header class="intro"><h1>Check in</h1></header></main>');
  assert.match(html, /data-fd-registration-checkin/);
  assert.match(html, /href="\/free-agents"/);
});

test('registration callout lands on Profile', () => {
  const html = injectJflRegistrationProfile('<main class="app" data-fd-modern-profile="true"><header class="topbar"></header></main>');
  assert.match(html, /data-fd-registration-profile/);
  assert.match(html, /href="\/teams"/);
});

test('JFL home includes registration shortcuts after shell decoration', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /href="\/free-agents"/);
  assert.match(html, /href="\/practice"/);
  assert.match(html, /data-fd-registration-links/);
  assert.match(html, /href="\/playoffs"/);
  assert.doesNotMatch(html, /href="\/trades"/);
  assert.match(html, /href="\/notifications"/);
});

test('JFL Teams includes the registration callout', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/teams'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-registration-teams/);
  assert.match(html, /href="\/free-agents"/);
});

test('JFL Schedule includes the registration callout', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/schedule'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-registration-schedule/);
  assert.match(html, /href="\/practice"/);
});

test('JFL Check in includes the registration callout', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/availability'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-registration-checkin/);
  assert.match(html, /href="\/teams"/);
});

test('JFL Profile includes the registration callout', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/profile'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-registration-profile/);
  assert.match(html, /href="\/teams"/);
});

test('season /fa and /awards aliases are public reads', async () => {
  const seasonId = '207abd00-3899-1ef2-d251-2a15efe5edc2';
  const fa = await routeJflSeasonPublicReads(
    new Request(`https://jfl.fremontderby.test/api/seasons/${seasonId}/fa`),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(fa.status, 200);
  assert.deepEqual(await fa.json(), { freeAgents: [] });

  const awards = await routeJflSeasonPublicReads(
    new Request(`https://jfl.fremontderby.test/api/seasons/${seasonId}/awards`),
    { ENVIRONMENT: 'jfl' },
  );
  assert.ok(awards);
  assert.notEqual(awards.status, 404);
});

test('season /rounds aliases the schedule handler', async () => {
  const seasonId = '207abd00-3899-1ef2-d251-2a15efe5edc2';
  const response = await routeJflSeasonSchedule(
    new Request(`https://jfl.fremontderby.test/api/seasons/${seasonId}/rounds`),
    { ENVIRONMENT: 'jfl' },
  );
  assert.ok(response);
  assert.notEqual(response.status, 404);
});
