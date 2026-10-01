import test from 'node:test';
import assert from 'node:assert/strict';
import { launchLine, nextMatchBriefing, testerEntry, testerMissionView, transferCaptaincy } from '../src/missionPlaySurface.js';

test('next match names the opponent, time, and place', () => {
  const briefing = nextMatchBriefing({ opponent: 'Rail Owls', when: 'Tuesday 7pm', where: 'Table 4' });
  assert.equal(briefing.text, 'You play Rail Owls Tuesday 7pm at Table 4.');
  assert.equal(nextMatchBriefing({ opponent: 'Rail Owls' }), null);
});

test('captaincy moves only to an eligible teammate', () => {
  const team = { captain: 'Mina', members: [{ name: 'Eli', eligible: true }, { name: 'Dax', eligible: false }] };
  assert.equal(transferCaptaincy(team, 'Eli').formerCanManage, false);
  assert.equal(transferCaptaincy(team, 'Dax').ok, false);
});

test('a tester sees the task, not the fixture, unless debug is asked for', () => {
  const mission = { persona: 'Player', action: 'Find your next match.', productRoutes: ['/schedule'], missionId: 'player.find-next-match', status: 'fixture-ready' };
  assert.equal(testerMissionView(mission).debug, null);
  assert.equal(testerMissionView(mission, { debug: true }).debug.missionId, 'player.find-next-match');
  assert.equal(launchLine(mission), 'Player: Find your next match.');
});

test('the campaign sends a tester to the product route, not the fixture preview', () => {
  assert.deepEqual(testerEntry({ status: 'fixture-ready', productRoutes: ['/schedule'] }), { kind: 'play', href: '/schedule' });
  assert.deepEqual(testerEntry({ status: 'fixture-ready', productRoutes: [] }), { kind: 'coming-soon', href: null });
});
