import test from 'node:test';
import assert from 'node:assert/strict';

import { routeQaScorecard, scoreSubmittedRackHistory } from '../src/qaScorecardRouteEnhancer.js';

const env = {
  ENVIRONMENT: 'jfl',
  CF_VERSION_METADATA: { id: 'score-regression-build' },
};

test('own submitted rack history advances score before opponent agreement', () => {
  assert.deepEqual(scoreSubmittedRackHistory([
    { rackNumber: 1, winnerSide: 'A' },
  ]), { a: 1, b: 0 });

  assert.deepEqual(scoreSubmittedRackHistory([
    { rackNumber: 1, winnerSide: 'A' },
    { rackNumber: 2, winnerSide: 'B' },
    { rackNumber: 3, winnerSide: 'A' },
    { rackNumber: 4, winnerSide: 'A' },
  ]), { a: 3, b: 1 });
});

test('terminal own history reaches target without requiring opponent submissions', () => {
  const result = scoreSubmittedRackHistory([
    { winnerSide: 'A' },
    { winnerSide: 'A' },
    { winnerSide: 'A' },
    { winnerSide: 'A' },
    { winnerSide: 'A' },
  ]);
  assert.deepEqual(result, { a: 5, b: 0 });
});

test('winner_side compatibility keeps persisted rack representations authoritative', () => {
  assert.deepEqual(scoreSubmittedRackHistory([
    { winner_side: 'B' },
    { winner_side: 'B' },
    { winner_side: 'A' },
  ]), { a: 1, b: 2 });
});

test('QA play route injects own-score synchronization without changing launcher behavior', async () => {
  const launcher = await routeQaScorecard(new Request('https://jfl.example/qa/scorecard'), env);
  assert.equal(launcher.status, 200);
  const launcherHtml = await launcher.text();
  assert.doesNotMatch(launcherHtml, /syncQaOwnScore/);

  const play = await routeQaScorecard(new Request('https://jfl.example/qa/scorecard/play?level=fresh&seed=regression'), env);
  assert.equal(play.status, 200);
  const html = await play.text();
  assert.match(html, /syncQaOwnScore/);
  assert.match(html, /Live individual score/);
  assert.match(html, /ownSide === 'A'/);
  assert.match(html, /MutationObserver/);
});

test('QA enhancer remains JFL-only and does not intercept unrelated routes', async () => {
  assert.equal(await routeQaScorecard(new Request('https://prod.example/qa/scorecard'), { ENVIRONMENT: 'production' }), null);
  assert.equal(await routeQaScorecard(new Request('https://jfl.example/teams'), env), null);
});
