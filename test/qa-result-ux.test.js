import test from 'node:test';
import assert from 'node:assert/strict';

import { enhanceQaResultUx } from '../src/qaResultUxEnhancer.js';

function baseHtml() {
  return `<!doctype html><html><head></head><body>
    <section class="qa-assertions">
      <h2>Assertions</h2>
      <p>Use the scorecard first.</p>
      <div class="qa-assertion"><span>A</span><button data-qa-assertion="0" data-value="pass" aria-pressed="false">PASS</button><button data-qa-assertion="0" data-value="fail" aria-pressed="false">FAIL</button></div>
      <div class="qa-assertion"><span>B</span><button data-qa-assertion="1" data-value="pass" aria-pressed="false">PASS</button><button data-qa-assertion="1" data-value="fail" aria-pressed="false">FAIL</button></div>
      <div class="qa-actions"><button data-qa-save>Save level result</button><a class="qa-next">Next</a></div>
      <div data-qa-result></div>
    </section>
  </body></html>`;
}

test('JFL QA play response gains explicit completion and visible outcome UX', async () => {
  const response = new Response(baseHtml(), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const request = new Request('https://jfl.fremontderby.com/qa/scorecard/play?level=fresh&seed=abc');
  const enhanced = await enhanceQaResultUx(response, request, { ENVIRONMENT: 'jfl' });
  const html = await enhanced.text();

  assert.match(html, /data-qa-progress/);
  assert.match(html, /Answer ' \+ remaining \+ ' remaining check/);
  assert.match(html, /save\.disabled = !complete/);
  assert.match(html, /Finish level/);
  assert.match(html, /MISSION FAILED — feedback saved\. A failed mission is a valid result\./);
  assert.match(html, /MISSION PASSED ✓ — feedback saved\./);
  assert.match(html, /actions\.before\(result\)/);
  assert.match(html, /result\.scrollIntoView/);
  assert.match(html, /qa-next\[data-qa-next-ready="false"\]/);
});

test('QA result enhancer is isolated from non-JFL and non-play routes', async () => {
  const html = baseHtml();
  const responseA = new Response(html, { headers: { 'content-type': 'text/html' } });
  const nonJfl = await enhanceQaResultUx(responseA, new Request('https://example.com/qa/scorecard/play'), { ENVIRONMENT: 'production' });
  assert.equal(await nonJfl.text(), html);

  const responseB = new Response(html, { headers: { 'content-type': 'text/html' } });
  const launcher = await enhanceQaResultUx(responseB, new Request('https://jfl.fremontderby.com/qa/scorecard'), { ENVIRONMENT: 'jfl' });
  assert.equal(await launcher.text(), html);
});
