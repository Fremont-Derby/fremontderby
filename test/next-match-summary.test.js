import assert from 'node:assert/strict';
import test from 'node:test';
import { pickNextMatch, nextMatchLabel } from '../src/nextMatchSummary.js';

test('pickNextMatch chooses the soonest future match', () => {
  const now = Date.parse('2026-09-17T12:00:00Z');
  const next = pickNextMatch([
    { starts_at: '2026-09-16T12:00:00Z', home_team_name: 'Past', away_team_name: 'Gone' },
    { starts_at: '2026-09-20T12:00:00Z', home_team_name: 'Later', away_team_name: 'Night' },
    { starts_at: '2026-09-18T12:00:00Z', home_team_name: 'Soon', away_team_name: 'First' },
  ], { now });
  assert.equal(nextMatchLabel(next), 'Soon vs First');
});

test('pickNextMatch can filter by team id', () => {
  const now = Date.parse('2026-09-17T12:00:00Z');
  const next = pickNextMatch([
    { starts_at: '2026-09-18T12:00:00Z', home_team_id: 'a', home_team_name: 'A', away_team_name: 'B' },
    { starts_at: '2026-09-19T12:00:00Z', home_team_id: 'c', home_team_name: 'C', away_team_name: 'D' },
  ], { now, teamId: 'c' });
  assert.equal(nextMatchLabel(next), 'C vs D');
});

test('pickNextMatch returns null when nothing is upcoming', () => {
  const now = Date.parse('2026-09-17T12:00:00Z');
  const next = pickNextMatch([
    { starts_at: '2026-09-16T12:00:00Z', home_team_name: 'Past', away_team_name: 'Gone' },
  ], { now });
  assert.equal(next, null);
});
