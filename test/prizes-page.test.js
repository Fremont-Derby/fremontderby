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

test('prizes first paint is truthful and unavailable until seasons resolve', () => {
  const html = renderPrizesPage();

  assert.match(html, /data-status aria-live="polite">Loading seasons…</);
  assert.doesNotMatch(html, /data-status[^>]*>Ready</);
  assert.match(html, /<label>Season\s*<select[^>]*data-season-id disabled>/);
  assert.doesNotMatch(html, /Season ID/);
  assert.doesNotMatch(html, /Load prizes/);
  assert.match(html, /seasonInput\.addEventListener\('change'/);
  assert.match(html, /data-page-state hidden aria-live="polite"/);
  assert.match(html, /No public seasons/);
  assert.match(html, /No season yet/);
  assert.match(html, /View league rules/);
});

test('prizes controls and payout rows preserve mobile legibility contract', () => {
  const html = renderPrizesPage();

  assert.match(html, /button\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(html, /select\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(html, /button:focus-visible, select:focus-visible/);
  assert.match(html, /@media \(max-width: 760px\)/);
  assert.match(html, /tbody, tr, td \{ display: block; width: 100%; \}/);
  assert.match(html, /td:nth-child\(4\)::before \{ content: 'Amount'; \}/);
  assert.doesNotMatch(html, /overflow-x:\s*auto/);
  assert.doesNotMatch(html, /min-width:\s*520px/);
});

test('prizes follows lifecycle-aware season fallback while preserving explicit and remembered choices', () => {
  const html = renderPrizesPage();

  const explicitIndex = html.indexOf("season.id === requestedSeason");
  const rememberedIndex = html.indexOf("season.id === rememberedSeason");
  const activeIndex = html.indexOf("['active', 'playoffs'].includes(season.status)");
  const registrationIndex = html.indexOf("season.status === 'registration'");
  const completeIndex = html.indexOf("season.status === 'complete'");

  assert.ok(explicitIndex > -1);
  assert.ok(rememberedIndex > explicitIndex);
  assert.ok(activeIndex > rememberedIndex);
  assert.ok(registrationIndex > activeIndex);
  assert.ok(completeIndex > registrationIndex);
});
