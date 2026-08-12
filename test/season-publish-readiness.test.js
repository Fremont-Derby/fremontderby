import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  deriveSeasonPublishReadiness,
  enhanceSeasonPublishReadiness,
} from '../src/seasonPublishReadinessEnhancer.js';

const routerPath = new URL('../src/routerEntry.js', import.meta.url);

function readyFixture({ waiting = 0 } = {}) {
  const teams = Array.from({ length: 8 }, (_, index) => ({
    slot_workflow_status: 'confirmed',
    captain_player_id: `captain-${index + 1}`,
    captain_has_phone: true,
  }));
  return {
    setup: {
      status: 'registration',
      first_round_date: '2026-09-03',
      round_interval_days: 7,
      default_table_numbers: [1, 2, 3, 4],
      rounds: [],
    },
    teamState: {
      registration: {
        teamCapacity: 8,
        counts: { confirmedTeams: 8, applicationsWaiting: waiting },
      },
      teams,
    },
  };
}

test('publish readiness is fully ready when authoritative publish blockers are clear', () => {
  const fixture = readyFixture();
  const readiness = deriveSeasonPublishReadiness(fixture.setup, fixture.teamState);
  assert.equal(readiness.canPublish, true);
  assert.equal(readiness.blockedCount, 0);
  assert.equal(readiness.attentionCount, 0);
  assert.equal(readiness.checks.find((check) => check.key === 'confirmed-teams').status, 'Ready');
  assert.equal(readiness.checks.find((check) => check.key === 'captain-contact').status, 'Ready');
});

test('waiting applications are visible advisory state without inventing a publish blocker', () => {
  const fixture = readyFixture({ waiting: 2 });
  const readiness = deriveSeasonPublishReadiness(fixture.setup, fixture.teamState);
  assert.equal(readiness.canPublish, true);
  assert.equal(readiness.blockedCount, 0);
  assert.equal(readiness.attentionCount, 1);
  const queue = readiness.checks.find((check) => check.key === 'registration-queue');
  assert.equal(queue.status, 'Needs attention');
  assert.match(queue.detail, /2 applications still waiting/);
});

test('publish readiness blocks incomplete teams, captain contact, setup, and an existing schedule', () => {
  const fixture = readyFixture();
  fixture.teamState.registration.counts.confirmedTeams = 7;
  fixture.teamState.teams = fixture.teamState.teams.slice(0, 7);
  fixture.teamState.teams[0].captain_has_phone = false;
  fixture.setup.first_round_date = null;
  fixture.setup.rounds = [{ roundId: 'already-published' }];
  const readiness = deriveSeasonPublishReadiness(fixture.setup, fixture.teamState);
  assert.equal(readiness.canPublish, false);
  assert.ok(readiness.blockedCount >= 4);
  assert.equal(readiness.checks.find((check) => check.key === 'confirmed-teams').status, 'Blocked');
  assert.equal(readiness.checks.find((check) => check.key === 'captain-contact').status, 'Blocked');
  assert.equal(readiness.checks.find((check) => check.key === 'schedule-configuration').status, 'Blocked');
  assert.equal(readiness.checks.find((check) => check.key === 'existing-schedule').status, 'Blocked');
});

test('season setup receives accessible publish readiness with canonical recovery links', async () => {
  const response = new Response('<html><body><main><form data-season-setup-form><select data-season-selector><option value="s1">Season 1</option></select><button data-publish>Publish schedule</button></form></main></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const enhanced = await enhanceSeasonPublishReadiness(response);
  const html = await enhanced.text();
  assert.match(html, /data-season-publish-readiness/);
  assert.match(html, /aria-label="Publish season readiness"/);
  assert.match(html, /Ready/);
  assert.match(html, /Blocked/);
  assert.match(html, /Needs attention/);
  assert.match(html, /\/admin\/season-teams\?season=/);
  assert.match(html, /#season-setup-form/);
  assert.match(html, /data-publish-readiness-retry/);
  assert.match(html, />Try again</);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /min-height:44px/);
  assert.match(html, /@media\(max-width:620px\)/);
  assert.match(html, /publish\.disabled=!readiness\.canPublish/);
});

test('publish readiness enhancer ignores non-HTML responses', async () => {
  const response = Response.json({ ok: true });
  const enhanced = await enhanceSeasonPublishReadiness(response);
  assert.equal(enhanced, response);
});

test('router entry runs publish readiness before close readiness on season setup', async () => {
  const source = await readFile(routerPath, 'utf8');
  assert.match(source, /enhanceSeasonPublishReadiness\(reconciled\)/);
  assert.match(source, /enhanceSeasonClose\(withPublishReadiness\)/);
});
