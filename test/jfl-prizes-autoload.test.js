import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPrizesPage } from '../src/prizesPage.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { applyJflPrizesAutoloadHtml } from '../src/jflPrizesAutoloadFix.js';
import worker from '../src/personaRouterEntry.js';

test('JFL prizes HTML drops the Load prizes button and keeps season autoload', () => {
  const html = applyJflPrizesAutoloadHtml(renderPrizesPage());
  assert.doesNotMatch(html, /Load prizes/);
  assert.doesNotMatch(html, /loadButton/);
  assert.match(html, /seasonInput.addEventListener\('change'/);
  assert.match(html, /if \(hasSeason\) await loadPrizes\(\)/);
});

test('JFL standings HTML drops the Load standings button', () => {
  const html = applyJflPrizesAutoloadHtml(renderStandingsPage());
  assert.doesNotMatch(html, /Load standings/);
  assert.doesNotMatch(html, /loadButton/);
  assert.match(html, /loadStandings/);
});

test('JFL /prizes and /standings responses have no extra Load button', async () => {
  for (const path of ['/prizes', '/standings']) {
    const response = await worker.fetch(
      new Request(`https://jfl.fremontderby.test${path}`),
      { ENVIRONMENT: 'jfl' },
    );
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.doesNotMatch(html, /Load prizes|Load standings/);
  }
});
