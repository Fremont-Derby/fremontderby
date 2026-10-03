import test from 'node:test';
import assert from 'node:assert/strict';
import { addPlayers, campaignMissions, recoverRack, selectedScoringState, triageDefect } from '../src/leaguePlaySlice.js';

test('a captain adds a new player and skips a duplicate', () => {
  const team = addPlayers({ captain: 'Mina', players: ['Eli'] }, ['Jules', 'Eli']);
  assert.deepEqual(team.added, ['Jules']);
  assert.deepEqual(team.players, ['Eli', 'Jules']);
});

test('the campaign lists only missions with a persona and a task', () => {
  const list = campaignMissions([{ persona: 'Player', task: 'Find your match' }, { persona: 'Captain' }]);
  assert.equal(list.length, 1);
  assert.equal(list[0].href, '/schedule');
});

test('a defect needs a human label and an issue number', () => {
  assert.equal(triageDefect({ label: 'wrong table', issue: 2256 }).text, 'wrong table tracks #2256');
  assert.equal(triageDefect({ label: 'wrong table' }), null);
});

test('undoing a rack keeps the match open', () => {
  const next = recoverRack({ racks: [8, 9] });
  assert.deepEqual(next.racks, [8]);
  assert.equal(next.matchOpen, true);
});

test('the selected scoring state names the player and the rack', () => {
  assert.equal(selectedScoringState({ player: 'Eli', rack: 3 }), 'Eli is selected for rack 3.');
  assert.equal(selectedScoringState({ player: 'Eli' }), null);
});
