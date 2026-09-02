import assert from 'node:assert/strict';
import test from 'node:test';
import { injectJflRegistrationNav } from '../src/jflRegistrationNav.js';
import worker from '../src/personaRouterEntry.js';

test('registration destinations are inserted before Standings in the more menu', () => {
  const html = injectJflRegistrationNav('<a href="/standings" data-nav-key="standings">Standings</a>');
  assert.match(html, /data-nav-key="free-agents"/);
  assert.match(html, /data-nav-key="playoffs"/);
  assert.match(html, /data-nav-key="trades"/);
  assert.match(html, /data-nav-key="notifications"/);
  assert.ok(html.indexOf('free-agents') < html.indexOf('standings'));
});

test('JFL home menu includes Free agents after shell decoration', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /href="\/free-agents"/);
  assert.match(html, /href="\/playoffs"/);
  assert.match(html, /href="\/trades"/);
  assert.match(html, /href="\/notifications"/);
});
