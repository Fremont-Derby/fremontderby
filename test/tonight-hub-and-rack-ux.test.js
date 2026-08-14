import assert from 'node:assert/strict';
import test from 'node:test';
import { liveRackLedgerAdapterSource } from '../src/liveRackLedgerAdapter.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import {
  sharedRackLedgerScorecardControllerSource,
} from '../src/rackLedgerScorecard.js';

test('live rack adapter retries offline and network failures', () => {
  assert.match(liveRackLedgerAdapterSource, /navigator\.onLine/);
  assert.match(liveRackLedgerAdapterSource, /attempt<1/);
  assert.match(liveRackLedgerAdapterSource, /offline/i);
  assert.match(liveRackLedgerAdapterSource, /addEventListener\('offline'/);
});

test('teams league-night hub includes schedule and dynamic score card hooks', () => {
  const html = renderTeamsPage();
  assert.match(html, /data-hub-score-title/);
  assert.match(html, /data-hub-schedule/);
  assert.match(html, /Tonight/);
  assert.match(html, /scorable-matches/);
});

test('rack ledger mismatch copy explains dual-score disagreement', () => {
  assert.match(sharedRackLedgerScorecardControllerSource, /Both teams submitted different winners/);
  assert.match(sharedRackLedgerScorecardControllerSource, /Agree on the table result/);
  assert.match(sharedRackLedgerScorecardControllerSource, /aria-label','Record rack/);
});
