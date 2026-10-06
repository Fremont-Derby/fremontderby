import test from 'node:test';
import assert from 'node:assert/strict';
import { pickNextMatch } from '../src/nextMatchSummary.js';

test('the next match is not another night', () => {
  const match = pickNextMatch([
    { season_id: 'other', scheduled_on: '2026-10-08', team_a_name: 'Marble' },
    { season_id: '76276670-96d6-413b-9091-d9f7de0bd597', scheduled_on: '2026-10-07', team_a_name: 'Burrows End Crew 0108' },
  ], { now: Date.parse('2026-10-06T00:00:00Z'), seasonId: '76276670-96d6-413b-9091-d9f7de0bd597' });
  assert.equal(match.team_a_name, 'Burrows End Crew 0108');
});
