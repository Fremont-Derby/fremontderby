import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('phase A rating surfaces wired', () => {
  const entry = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(entry, /recompute-derby-estimate/);
  assert.match(entry, /admin\/rating-health/);
  assert.ok(existsSync(new URL('../src/derbyEstimate.js', import.meta.url)));
  assert.ok(existsSync(new URL('../supabase/migrations/20260816280000_recompute_derby_estimate.sql', import.meta.url)));
  assert.ok(existsSync(new URL('../docs/spikes/fargo-challonge-publish-142.md', import.meta.url)));
});

test('phase C modules present', () => {
  const entry = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(entry, /admin\/player-stats/);
  assert.ok(existsSync(new URL('../src/seasonScheduleGenerator.js', import.meta.url)));
  assert.ok(existsSync(new URL('../src/playerSeasonStats.js', import.meta.url)));
  assert.ok(existsSync(new URL('../docs/season-schedule-blackouts.md', import.meta.url)));
});
