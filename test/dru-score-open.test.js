import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { finishRemainingLabel, mergeScorableMatches, openScoringLabel, raceInserts, raceResultPatch, scoreRowsForMatch } from '../src/druScoreOpen.js';

test('a scheduled match can be opened for scoring without a captain login', () => {
  assert.equal(openScoringLabel(), 'Open this match for scoring');
  assert.equal(finishRemainingLabel(), 'Finish remaining regular matches');
  const rows = scoreRowsForMatch({ id: 'match-1', team_a_name: 'Clover Cups', team_b_name: 'Ribbon Boats', team_a_id: 'a', round_number: 1, scheduled_on: '2026-10-07' });
  assert.equal(rows.length, 3);
  assert.equal(rows[0].team_match_id, 'match-1');
  const merged = mergeScorableMatches([{ player_match_id: 'already' }], rows);
  assert.equal(merged.length, 4);
});

test('opening a match writes a race for each paired roster player', () => {
  const rows = raceInserts(
    { id: 'match-1', season_id: 'season-1', round_id: 'round-1', team_a_id: 'home', team_b_id: 'away' },
    ['a1', 'a2'],
    ['b1', 'b2', 'b3'],
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].player_a_id, 'a1');
  assert.equal(rows[1].player_b_id, 'b2');
  assert.equal(rows[0].status, 'scheduled');
});

test('a DRU race save records the winning side without the captain rack route', () => {
  const patch = raceResultPatch({ player_a_id: 'home-player', player_b_id: 'away-player' }, 'B');
  assert.equal(patch.winner_side, 'B');
  assert.equal(patch.winner_player_id, 'away-player');
  assert.equal(patch.status, 'finalized');
  const page = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(page, /won/);
  assert.match(page, /\/api\/dru\/player-matches\//);
});

test('a DRU match save records the team winner without the score list', () => {
  const patch = raceResultPatch({ player_a_id: 'home-player', player_b_id: 'away-player' }, 'A');
  assert.equal(patch.winner_side, 'A');
  const page = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.equal(page.includes('scoreDruTeamMatch'), true);
});

test('a captain disagreement is not blocked by the notice link', () => {
  const page = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  const start = page.indexOf('handleTeamMatchDisputeRequest');
  const block = page.slice(start, start + 1200);
  assert.equal(block.includes('href: null'), true);
  assert.equal(block.includes('The disagreement still counts'), true);
});
