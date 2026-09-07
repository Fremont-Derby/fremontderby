import test from 'node:test';
import assert from 'node:assert/strict';

import { QA_MISSIONS, buildQaMissionFixture, routeQaMissionCampaign } from '../src/qaMissionCampaign.js';

const env = {
  ENVIRONMENT: 'jfl',
  CF_VERSION_METADATA: { id: 'mission-build-sha' },
};

test('mission catalog uses persona + action contracts instead of route-only levels', () => {
  assert.ok(QA_MISSIONS.length >= 5);
  for (const mission of QA_MISSIONS) {
    assert.match(mission.missionId, /^(player|captain)\./);
    assert.ok(mission.persona);
    assert.ok(mission.context);
    assert.ok(mission.action);
    assert.ok(['natural', 'deep_link'].includes(mission.entryMode));
    assert.ok(Number.isInteger(mission.estimatedSeconds));
    assert.ok(mission.assertions.length >= 3);
    assert.ok(mission.randomizableFields.length >= 1);
    assert.ok(mission.invariants.length >= 1);
    for (const assertion of mission.assertions) {
      assert.ok(['human', 'machine', 'mixed'].includes(assertion.type));
      assert.ok(assertion.id);
      assert.ok(assertion.text);
    }
  }
});

test('campaign is JFL-only and groups Player and Captain missions', async () => {
  const response = routeQaMissionCampaign(new Request('https://jfl.example/qa'), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Pick a role\. Complete the mission\./);
  assert.match(html, /PLAYER WORLD/);
  assert.match(html, /CAPTAIN WORLD/);
  assert.match(html, /You are a player\./);
  assert.match(html, /You are a captain\./);
  assert.match(html, /Find when and where you play next/);
  assert.match(html, /Add the correct new players to your team/);
  assert.match(html, /Hand captain responsibility to the correct teammate/);
  assert.match(html, /Record the first rack correctly/);
  assert.match(html, /mission-build-sha/);
  assert.equal(routeQaMissionCampaign(new Request('https://prod.example/qa'), { ENVIRONMENT: 'production' }), null);
});

test('existing Scorecard first-rack behavior is exposed as a playable captain mission', async () => {
  const mission = QA_MISSIONS.find((item) => item.missionId === 'captain.score-first-rack');
  assert.equal(mission.status, 'playable');
  assert.equal(mission.persona, 'Captain');
  assert.equal(mission.entryMode, 'deep_link');
  assert.equal(mission.playHref, '/qa/scorecard/play?level=fresh');

  const response = routeQaMissionCampaign(new Request('https://jfl.example/qa'), env);
  const html = await response.text();
  assert.match(html, /href="\/qa\/scorecard\/play\?level=fresh"/);
  assert.match(html, /Start mission/);
});

test('player next-match fixture is deterministic for exact seed replay', () => {
  const first = buildQaMissionFixture('player.find-next-match', 'player-seed-42');
  const replay = buildQaMissionFixture('player.find-next-match', 'player-seed-42');
  assert.deepEqual(replay, first);
  assert.equal(first.semantic.exactlyOneNextMatch, true);
  assert.equal(first.semantic.matchIsFuture, true);
  assert.equal(first.semantic.personaIsRosteredPlayer, true);
  assert.ok(first.nextMatch.opponent.name);
  assert.ok(first.nextMatch.date);
  assert.ok(first.nextMatch.time);
  assert.ok(first.nextMatch.venue);
});

test('fresh player mission seeds vary display data without changing semantics', () => {
  const first = buildQaMissionFixture('player.find-next-match', 'seed-a');
  const second = buildQaMissionFixture('player.find-next-match', 'seed-b');
  assert.deepEqual(first.semantic, second.semantic);
  assert.notDeepEqual(
    [first.player.name, first.team.name, first.nextMatch.opponent.name, first.nextMatch.roundNumber, first.nextMatch.venue],
    [second.player.name, second.team.name, second.nextMatch.opponent.name, second.nextMatch.roundNumber, second.nextMatch.venue],
  );
});

test('fixture preview is explicit that product integration is not faked and can replay exact seed', async () => {
  const response = routeQaMissionCampaign(new Request('https://jfl.example/qa/mission/preview?mission=player.find-next-match&seed=replay-me'), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Not a product test yet\./);
  assert.match(html, /seed.*replay-me/i);
  assert.match(html, /Replay exact seed/);
  assert.match(html, /exactlyOneNextMatch/);

  const unsupported = routeQaMissionCampaign(new Request('https://jfl.example/qa/mission/preview?mission=captain.add-players&seed=x'), env);
  assert.equal(unsupported.status, 409);
});
