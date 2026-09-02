import assert from 'node:assert/strict';
import test from 'node:test';
import { injectJflRegistrationHome, injectJflRegistrationNav } from '../src/jflRegistrationNav.js';
import worker from '../src/personaRouterEntry.js';

test('registration destinations are inserted before Standings in the more menu', () => {
  const html = injectJflRegistrationNav('<a href="/standings" data-nav-key="standings">Standings</a>');
  assert.match(html, /data-nav-key="free-agents"/);
  assert.match(html, /data-nav-key="practice"/);
  assert.match(html, /data-nav-key="playoffs"/);
  assert.match(html, /data-nav-key="trades"/);
  assert.match(html, /data-nav-key="notifications"/);
  assert.ok(html.indexOf('practice') < html.indexOf('standings'));
});

test('registration shortcuts land on the modern home header', () => {
  const html = injectJflRegistrationHome('<main class="fd-home" data-fd-modern-home="true"><header></header></main>');
  assert.match(html, /data-fd-registration-links/);
  assert.match(html, /href="\/free-agents"/);
  assert.match(html, /href="\/practice"/);
  assert.match(html, /href="\/availability"/);
});

test('JFL home includes registration shortcuts after shell decoration', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /href="\/free-agents"/);
  assert.match(html, /href="\/practice"/);
  assert.match(html, /data-fd-registration-links/);
  assert.match(html, /href="\/playoffs"/);
  assert.match(html, /href="\/trades"/);
  assert.match(html, /href="\/notifications"/);
});
