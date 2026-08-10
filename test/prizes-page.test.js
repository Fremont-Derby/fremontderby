import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPrizesPage } from '../src/prizesPage.js';

test('prizes page renders public aggregate purse controls and tables', () => {
  const html = renderPrizesPage();

  assert.match(html, /Fremont Derby Prizes/);
  assert.match(html, /data-season-id/);
  assert.match(html, /data-player-count/);
  assert.match(html, /data-committed/);
  assert.match(html, /data-collected/);
  assert.match(html, /data-prize-pool/);
  assert.match(html, /data-team-pool/);
  assert.match(html, /data-individual-pool/);
  assert.match(html, /data-projected-body/);
  assert.match(html, /data-finalized-body/);
  assert.match(html, /\/api\/seasons\//);
  assert.match(html, /\/prizes/);
  assert.doesNotMatch(html, /payment_status|amount_due_cents|player_id/);
});
