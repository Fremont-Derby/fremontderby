import test from 'node:test';
import assert from 'node:assert/strict';
import { auditedCorrection, blindLineup, dualScore, publishedSchedule, standingsAfterFinal } from '../src/gateChecks2.js';

test('the published season is eight teams and seven rounds', () => {
  assert.equal(publishedSchedule({ teams: 8, rounds: 7 }).ok, true);
  assert.equal(publishedSchedule({ teams: 4, rounds: 7 }).ok, false);
});

test('a blind lineup has three players', () => {
  assert.equal(blindLineup({ players: ['a', 'b', 'c'], blind: true }).ok, true);
  assert.equal(blindLineup({ players: ['a'], blind: true }).ok, false);
});

test('both teams are required to score', () => {
  assert.equal(dualScore({ home: 'Owls', away: 'Sharks' }).ok, true);
});

test('standings wait for finalized play', () => {
  assert.equal(standingsAfterFinal([{ final: true }, { final: false }]).ok, false);
});

test('a correction needs both sides and a reason', () => {
  assert.equal(auditedCorrection({ actor: 'Mina', reason: 'fix', before: '3', after: '4' }).ok, true);
  assert.equal(auditedCorrection({ actor: 'Mina' }).ok, false);
});
