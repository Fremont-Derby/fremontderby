import test from 'node:test';
import assert from 'node:assert/strict';
import { pickNextMatch, nextMatchLabel } from '../src/nextMatchSummary.js';

const now = Date.parse('2026-09-17T20:00:00Z');

test('picks the soonest future match for the requested team', () => {
  const next = pickNextMatch([
    { team_id: 't1', starts_at: '2026-09-16T20:00:00Z', home_team_name: 'Past', away_team_name: 'Gone' },
    { team_id: 't2', starts_at: '2026-09-18T20:00:00Z', home_team_name: 'Other', away_team_name: 'Side' },
    { home_team_id: 't1', starts_at: '2026-09-19T20:00:00Z', home_team_name: 'Rail Owls', away_team_name: 'Felt Crew' },
    { team_id: 't1', starts_at: '2026-09-18T19:00:00Z', home_team_name: 'Rail Owls', away_team_name: 'Sharks' },
  ], { now, teamId: 't1' });
  assert.equal(next.away_team_name, 'Sharks');
  assert.equal(nextMatchLabel(next), 'Rail Owls vs Sharks');
});

test('returns null when nothing upcoming is published', () => {
  assert.equal(pickNextMatch([{ team_id: 't1', starts_at: '2026-09-01T00:00:00Z' }], { now, teamId: 't1' }), null);
  assert.equal(nextMatchLabel(null), 'No upcoming match published');
});
