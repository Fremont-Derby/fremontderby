import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPrizesPage } from '../src/prizesPage.js';
import { applyJflPrizesAutoloadHtml } from '../src/jflPrizesAutoloadFix.js';
import worker from '../src/personaRouterEntry.js';

test('JFL prizes HTML drops the Load prizes button and keeps season autoload', () => {
  const html = applyJflPrizesAutoloadHtml(renderPrizesPage());
  assert.doesNotMatch(html, /Load prizes/);
  assert.doesNotMatch(html, /loadButton/);
  assert.match(html, /seasonInput.addEventListener\('change'/);
  assert.match(html, /if \(hasSeason\) await loadPrizes\(\)/);
});

test('JFL /prizes response has no Load prizes button', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/prizes'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Fremont Derby Prizes/);
  assert.doesNotMatch(html, /Load prizes/);
});
