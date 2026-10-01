import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { liveRackLedgerAdapterSource } from '../src/liveRackLedgerAdapter.js';
import { sharedRackLedgerScorecardControllerSource, sharedRackLedgerScorecardMarkup } from '../src/rackLedgerScorecard.js';

function recoveryFor(error) {
  const source = sharedRackLedgerScorecardControllerSource.match(/function showLoadFailure\(error\)\{[^\n]+\}/)?.[0];
  assert.ok(source, 'load recovery controller exists');
  const text = new Map();
  const appEl = { dataset: {} };
  const loadRecoveryEl = { hidden: true };
  const showLoadFailure = vm.runInNewContext(`(${source})`, {
    appEl,
    loadRecoveryEl,
    setText: (selector, value) => text.set(selector, value),
    setStatus: (message, tone) => text.set('status', `${message}:${tone}`),
  });
  showLoadFailure(error);
  assert.equal(appEl.dataset.loadState, 'unavailable');
  assert.equal(loadRecoveryEl.hidden, false);
  assert.equal(text.get('status'), 'Scorecard unavailable:error');
  return text;
}

test('missing or unauthorized match uses the same non-sensitive link recovery', () => {
  const missing = recoveryFor(Object.assign(new Error('Player match not found'), { status: 404 }));
  const unauthorized = recoveryFor(Object.assign(new Error('Forbidden'), { status: 403 }));
  for (const result of [missing, unauthorized]) {
    assert.equal(result.get('[data-load-title]'), 'This scorecard link is unavailable');
    assert.match(result.get('[data-load-detail]'), /outdated, or this match may not be available to you/);
    assert.equal(result.get('[data-match-context]'), 'Scorecard link unavailable');
    assert.doesNotMatch(result.get('[data-load-detail]'), /scheduled matchup/);
  }
  assert.match(sharedRackLedgerScorecardMarkup, /href="\/scorecard">Back to Score picker<\/a>/);
});

test('a known unrevealed race keeps the lineup-reveal recovery', () => {
  const result = recoveryFor(new Error('No revealed player match is ready to score'));
  assert.equal(result.get('[data-load-title]'), 'This race is not ready to score');
  assert.match(result.get('[data-load-detail]'), /Check the lineup reveal/);
  assert.equal(result.get('[data-match-context]'), 'Scheduled matchup');
});

test('unexpected load errors retain a safe persistent recovery, not a scoring action error', () => {
  const result = recoveryFor(new Error('Network failed'));
  assert.equal(result.get('[data-load-title]'), 'Scorecard could not load');
  assert.match(result.get('[data-load-detail]'), /No score was changed/);
  assert.doesNotMatch(result.get('[data-load-title]'), /Action failed/);
  assert.match(liveRackLedgerAdapterSource, /failure\.status=response\.status/);
});
