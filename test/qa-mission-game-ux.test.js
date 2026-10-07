import test from 'node:test';
import assert from 'node:assert/strict';

import { enhanceQaMissionGameUx } from '../src/qaMissionGameUxEnhancer.js';

function campaignHtml() {
  return `<!doctype html><html><body>
    <main>
      <div>JFL HUMAN QA · PERSONA MISSIONS</div>
      <div class="build">Build <code>abc123</code></div>
      <article class="mission"><span class="status">FIXTURE READY</span><p>Find when and where you play next, and who your team faces.</p><a class="secondary" href="/qa/mission/preview?mission=player.find-next-match">Preview randomized mission</a></article>
      <article class="mission"><span class="status">COMING NEXT</span><p>Mark whether you can play in the upcoming match.</p><button type="button" disabled title="Mission fixture integration is not wired yet">Coming next</button></article>
      <article class="mission"><span class="status">FIXTURE READY</span><p>Some future mission.</p><a class="secondary" href="/qa/mission/preview?mission=player.future">Preview randomized mission</a></article>
      <footer>Fresh runs use seeded randomized data. Playable missions exercise the QA product fixture; “fixture ready” means the randomized Arrange contract exists but product integration is intentionally not faked yet.</footer>
    </main>
  </body></html>`;
}

test('JFL campaign promotes real Player missions while keeping unfinished fixture previews out', async () => {
  const response = new Response(campaignHtml(), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const request = new Request('https://jfl.fremontderby.com/qa');
  const enhanced = await enhanceQaMissionGameUx(response, request, { ENVIRONMENT: 'jfl' });
  const html = await enhanced.text();

  assert.doesNotMatch(html, /Preview randomized mission/);
  assert.doesNotMatch(html, /FIXTURE READY/);
  assert.doesNotMatch(html, /Build <code>/);
  assert.match(html, /href="\/qa\/mission\/start\?mission=player\.find-next-match"/);
  assert.match(html, /href="\/qa\/mission\/start\?mission=player\.mark-availability"/);
  assert.equal((html.match(/PLAYABLE/g) || []).length, 2);
  assert.match(html, /COMING SOON/);
  assert.match(html, /This mission is not playable yet/);
  assert.match(html, /genuinely playable/);
  assert.match(html, /data-mission-id="player\.find-next-match"/);
  assert.match(html, /fd\.qa\.persona\.results\.v1/);
  assert.match(html, /fd\.qa\.evidence\.pending\.v1/);
  assert.match(html, /Last run:/);
});

test('mission game enhancer is isolated from debug preview and non-JFL routes', async () => {
  const html = campaignHtml();

  const preview = await enhanceQaMissionGameUx(
    new Response(html, { headers: { 'content-type': 'text/html' } }),
    new Request('https://jfl.fremontderby.com/qa/mission/preview?mission=player.find-next-match'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(await preview.text(), html);

  const production = await enhanceQaMissionGameUx(
    new Response(html, { headers: { 'content-type': 'text/html' } }),
    new Request('https://fremontderby.com/qa'),
    { ENVIRONMENT: 'production' },
  );
  assert.equal(await production.text(), html);
});
