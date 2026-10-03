import test from 'node:test';
import assert from 'node:assert/strict';
import { feedForMatch, toFargoFeed } from '../src/fargoFeed.js';

test('the public Fargo feed includes finalized matches and is not accepted', () => {
  const feed = toFargoFeed([
    { status: 'finalized', playerMatchId: 'm1', playerAId: 'a', playerBId: 'b', playerAFargoId: '1', playerBFargoId: '2', racks: [] },
    { status: 'open', playerMatchId: 'm2' },
  ], { generatedAt: '2026-10-02T00:00:00Z' });
  assert.equal(feed.feed, 'fremont-derby-fargo');
  assert.equal(feed.acceptedByFargo, false);
  assert.equal(feed.items[0].reportStatus, 'not_sent');
  assert.match(feed.items[0].sourceUrl, /playerMatchId=/);
  assert.equal(feed.items.length, 1);
  assert.equal(feed.items[0].sent, false);
});

test('a Fargo feed URL can return one match', () => {
  const feed = toFargoFeed([
    { status: 'finalized', playerMatchId: 'one', playerAName: 'A', playerBName: 'B' },
    { status: 'finalized', playerMatchId: 'two', playerAName: 'C', playerBName: 'D' },
  ]);
  const one = feedForMatch(feed, 'one');
  assert.equal(one.items.length, 1);
  assert.equal(one.items[0].playerMatchId, 'one');
});
