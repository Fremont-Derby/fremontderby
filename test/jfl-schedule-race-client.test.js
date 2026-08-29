import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  jflScheduleRaceClientScript,
  jflScheduleRaceStyles,
} from '../src/jflScheduleRaceClient.js';
import {
  decorateJflModernShell,
  jflDeployTimeClientScript,
} from '../src/jflModernShell.js';
import { renderPrimaryNavigation } from '../src/appShell.js';

function shellResponse() {
  return new Response(`<!doctype html><html><head><title>JFL proof</title></head><body>${renderPrimaryNavigation('/schedule')}<main>Schedule proof</main></body></html>`, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

test('Schedule race enhancer consumes the actual enriched playerResults contract', () => {
  assert.match(jflScheduleRaceClientScript, /playerResults/);
  assert.match(jflScheduleRaceClientScript, /teamMatchId/);
  assert.match(jflScheduleRaceClientScript, /dataset\.teamMatchId/);
  assert.match(jflScheduleRaceClientScript, /Race details/);
  assert.match(jflScheduleRaceClientScript, /scoreA/);
  assert.match(jflScheduleRaceClientScript, /scoreB/);
  assert.match(jflScheduleRaceClientScript, /raceToA/);
  assert.match(jflScheduleRaceClientScript, /raceToB/);
  assert.match(jflScheduleRaceClientScript, /slotNumber/);
});

test('Schedule race enhancer enforces 3 regular-season and 4 postseason result expectations without fabricating rows', () => {
  assert.match(jflScheduleRaceClientScript, /isPostseasonRound/);
  assert.match(jflScheduleRaceClientScript, /\? 4 : 3/);
  assert.match(jflScheduleRaceClientScript, /Result data is incomplete/);
  assert.match(jflScheduleRaceClientScript, /results\.map\(raceRow\)/);
  assert.doesNotMatch(jflScheduleRaceClientScript, /while\s*\([^)]*results\.length/);
});

test('active router wires the JFL enriched season schedule endpoint before legacy routing', async () => {
  const routerEntry = await readFile(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(routerEntry, /routeJflSeasonSchedule/);
  const routeIndex = routerEntry.indexOf('await routeJflSeasonSchedule(request, env)');
  const legacyIndex = routerEntry.indexOf('await legacyRouter.fetch(request, env, ctx)');
  assert.ok(routeIndex >= 0, 'JFL enriched schedule route must be invoked');
  assert.ok(legacyIndex > routeIndex, 'JFL enriched schedule route must run before legacy API delegation');
});

test('Schedule race detail styling makes winners clear while retaining loser context', () => {
  assert.match(jflScheduleRaceStyles, /fd-schedule-race__player--winner/);
  assert.match(jflScheduleRaceStyles, /fd-schedule-race__player--loser/);
  assert.match(jflScheduleRaceStyles, /font-variant-numeric:\s*tabular-nums/);
  assert.match(jflScheduleRaceStyles, /fd-schedule-match__race-warning/);
  assert.match(jflScheduleRaceStyles, /@media\s*\(forced-colors:\s*active\)/);
});

test('JFL Schedule shell injects race enhancer but other routes do not', async () => {
  const env = {
    ENVIRONMENT: 'jfl',
    CF_VERSION_METADATA: { id: 'version-123', timestamp: '2026-08-28T05:46:00.000Z' },
  };
  const schedule = await decorateJflModernShell(
    shellResponse(),
    new Request('https://jfl.fremontderby.com/schedule'),
    env,
  );
  const scheduleHtml = await schedule.text();
  assert.match(scheduleHtml, /data-fd-jfl-schedule-races/);
  assert.match(scheduleHtml, /data-fd-jfl-schedule-race-styles/);
  assert.match(scheduleHtml, /Race details/);

  const teams = await decorateJflModernShell(
    shellResponse(),
    new Request('https://jfl.fremontderby.com/teams'),
    env,
  );
  assert.doesNotMatch(await teams.text(), /data-fd-jfl-schedule-races/);
});

test('deployment badge preserves authoritative UTC timestamp and localizes in the browser', async () => {
  assert.match(jflDeployTimeClientScript, /Intl\.DateTimeFormat/);
  assert.match(jflDeployTimeClientScript, /data-fd-jfl-deploy-time/);
  assert.match(jflDeployTimeClientScript, /deployTimestamp/);

  const response = await decorateJflModernShell(
    shellResponse(),
    new Request('https://jfl.fremontderby.com/schedule'),
    {
      ENVIRONMENT: 'jfl',
      CF_VERSION_METADATA: { id: 'version-123', timestamp: '2026-08-28T05:46:00.000Z' },
    },
  );
  const html = await response.text();
  assert.match(html, /data-deploy-timestamp="2026-08-28T05:46:00\.000Z"/);
  assert.match(html, /data-fd-jfl-local-deploy-time/);
  assert.match(html, /data-fd-jfl-deploy-time/);
});
