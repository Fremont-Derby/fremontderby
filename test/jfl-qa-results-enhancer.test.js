import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { enhanceJflQaResults } from '../src/jflQaResultsEnhancer.js';

const page = () => new Response('<html><body><main>Score</main></body></html>', {
  headers: { 'content-type': 'text/html' },
});
test('JFL Score gets private result UI and parseable browser script', async () => {
  const response = await enhanceJflQaResults(page(), { ENVIRONMENT: 'jfl' });
  const html = await response.text();
  assert.match(html, /Private QA matchup results/);
  assert.match(html, /\/api\/me\/jfl-qa-results/);
  assert.match(html, /textContent/);
  assert.doesNotMatch(html, /SERVICE_ROLE|innerHTML/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script);
});
test('other environments and non-HTML responses remain untouched', async () => {
  const source = page();
  assert.equal(await enhanceJflQaResults(source, { ENVIRONMENT: 'production' }), source);
  const json = Response.json({ ok: true });
  assert.equal(await enhanceJflQaResults(json, { ENVIRONMENT: 'jfl' }), json);
});
