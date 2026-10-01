import test from 'node:test';
import assert from 'node:assert/strict';
import { disputedResult, missionTask, outsideTap, rackStep, selectedScore, stuckPath, submitResult, terminalMismatch } from '../src/scoreFlow.js';

test('a rack is named before the score', () => {
  assert.match(rackStep({}).text, /Name the rack/);
  assert.match(rackStep({ rack: 2 }).text, /Rack 2/);
});

test('the selected score is named', () => {
  assert.match(selectedScore({ selected: 'Owls' }).text, /Owls/);
  assert.match(selectedScore({}).text, /Nothing is selected/);
});

test('a disputed submission is not the result', () => {
  assert.equal(disputedResult({ disputed: true, winner: 'Owls' }).authoritative, false);
});

test('an outside tap closes the menu and keeps the dock', () => {
  assert.equal(outsideTap('page').closeMenu, true);
  assert.equal(outsideTap('page').keepDock, true);
});

test('a finished rack cannot stay open', () => {
  assert.equal(terminalMismatch({ terminal: true, open: true }).ok, false);
});

test('submit waits until every rack is done', () => {
  assert.equal(submitResult({ complete: false }).done, false);
});

test('the mission shows the task', () => {
  assert.equal(missionTask({ ask: 'Mark availability.' }).text, 'Mark availability.');
});

test('a stuck path has a way back', () => {
  assert.match(stuckPath({}).text, /schedule/);
});
