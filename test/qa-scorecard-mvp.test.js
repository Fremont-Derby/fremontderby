import test from 'node:test';
import assert from 'node:assert/strict';

import { buildQaScorecardFixture, routeQaScorecard } from '../src/qaScorecardHttp.js';

const env = {
  ENVIRONMENT: 'jfl',
  CF_VERSION_METADATA: { id: 'worker-version', tag: 'b794a527bacb1347ecb89b1dd2931e1c787c8240' },
};

test('QA scorecard fixture is deterministic for exact seed replay', () => {
  const first = buildQaScorecardFixture('finish', 'seed-123');
  const replay = buildQaScorecardFixture('finish', 'seed-123');
  assert.deepEqual(replay, first);
  assert.equal(first.racksA.length, first.racksB.length);
  const scoreA = first.racksA.filter((rack) => rack.winnerSide === 'A').length;
  assert.equal(scoreA, first.targetA - 1);
});

test('fresh seeds can vary non-semantic data while preserving the level contract', () => {
  const first = buildQaScorecardFixture('fresh', 'seed-a');
  const second = buildQaScorecardFixture('fresh', 'seed-b');
  assert.equal(first.racksA.length, 0);
  assert.equal(first.racksB.length, 0);
  assert.equal(second.racksA.length, 0);
  assert.equal(second.racksB.length, 0);
  assert.notDeepEqual(
    [first.playerA.name, first.playerB.name, first.teamA.name, first.teamB.name, first.roundNumber],
    [second.playerA.name, second.playerB.name, second.teamA.name, second.teamB.name, second.roundNumber],
  );
});

test('mismatch level always starts with a concrete rack disagreement', () => {
  const fixture = buildQaScorecardFixture('mismatch', 'anything');
  assert.equal(fixture.racksA.length, 3);
  assert.equal(fixture.racksB.length, 3);
  assert.equal(fixture.racksA[0].winnerSide, fixture.racksB[0].winnerSide);
  assert.notEqual(fixture.racksA[1].winnerSide, fixture.racksB[1].winnerSide);
});

test('launcher is JFL-only and exposes three one-tap levels', async () => {
  const response = routeQaScorecard(new Request('https://jfl.example/qa/scorecard'), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Three levels\. Beat them\./);
  assert.match(html, /Fresh race · first rack/);
  assert.match(html, /One rack from finish/);
  assert.match(html, /Mismatch · recovery/);
  assert.match(html, /b794a527bacb1347ecb89b1dd2931e1c787c8240/);
  assert.equal(routeQaScorecard(new Request('https://prod.example/qa/scorecard'), { ENVIRONMENT: 'production' }), null);
});

test('play route creates a seed when omitted and exact seed renders human assertions', async () => {
  const redirect = routeQaScorecard(new Request('https://jfl.example/qa/scorecard/play?level=fresh'), env);
  assert.equal(redirect.status, 302);
  assert.match(redirect.headers.get('location'), /level=fresh&seed=/);

  const response = routeQaScorecard(new Request('https://jfl.example/qa/scorecard/play?level=fresh&seed=replay-42'), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Seed <code>replay-42<\/code>/);
  assert.match(html, /Build <code>b794a527bacb1347ecb89b1dd2931e1c787c8240<\/code>/);
  assert.match(html, /data-qa-assertion="0"/);
  assert.match(html, /Save level result/);
  assert.match(html, /Play again · new data/);
  assert.match(html, /Replay exact seed/);
  assert.match(html, /fd\.qa\.scorecard\.results\.v1/);
  assert.match(html, /fd\.qa\.evidence\.pending\.v1/);
  assert.match(html, /\/api\/qa\/evidence/);
  assert.match(html, /Evidence pending/);
  assert.match(html, /row\.level_id==='scorecard\.'\+level/);
  assert.match(html, /replay_of/);
  assert.match(html, /Score Rack/);
  assert.match(html, /Keep scoring · race not finished/);
});

test('level result contract records build, seed, timing, assertions and device evidence', async () => {
  const response = routeQaScorecard(new Request('https://jfl.example/qa/scorecard/play?level=mismatch&seed=contract'), env);
  const html = await response.text();
  assert.match(html, /build_sha:build/);
  assert.match(html, /duration_ms:Date\.now\(\)-started/);
  assert.match(html, /device:device\(\)/);
  assert.match(html, /outcome:passed\?'pass':'fail'/);
  assert.match(html, /LEVEL BEATEN/);
  assert.match(html, /LEVEL FAILED/);
});
