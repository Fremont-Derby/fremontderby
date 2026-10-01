import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDerbyEstimate,
  edgesFromOpenMatches,
  DERBY_ESTIMATE_VERSION,
} from '../src/derbyEstimate.js';

test('prior only when no evidence', () => {
  const r = computeDerbyEstimate([]);
  assert.equal(r.rating, 500);
  assert.equal(r.confidence, 'low');
  assert.equal(r.version, DERBY_ESTIMATE_VERSION);
});

test('wins vs stronger field pull estimate up', () => {
  const edges = [
    { opponentRating: 600, won: true, weight: 2 },
    { opponentRating: 580, won: true, weight: 2 },
    { opponentRating: 560, won: false, weight: 1 },
  ];
  const r = computeDerbyEstimate(edges);
  assert.ok(r.rating > 500);
  assert.ok(r.rating < 700);
  assert.equal(r.method, 'anchored_wl_v1');
});

test('open match edges respect external ids and down-weight match-only', () => {
  const edges = edgesFromOpenMatches(
    [
      {
        winner_external_id: 'p1',
        loser_external_id: 'opp',
        racks_won_winner: 7,
        racks_won_loser: 3,
      },
      {
        winner_external_id: 'opp2',
        loser_external_id: 'p1',
        // no racks
      },
    ],
    {
      playerExternalIds: new Set(['p1']),
      ratingByExternalId: new Map([['opp', 550], ['opp2', 520]]),
    },
  );
  assert.equal(edges.length, 2);
  assert.ok(edges[0].weight > edges[1].weight);
  assert.equal(edges[0].won, true);
  assert.equal(edges[1].won, false);
});
