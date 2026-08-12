import assert from 'node:assert/strict';
import test from 'node:test';

import { renderPrimaryNavigation } from '../src/appShell.js';
import routerEntry from '../src/routerEntry.js';
import { normalizeShellNavigationLabels } from '../src/shellNavigationLabels.js';

test('mobile quick navigation calls the schedule destination Schedule', async () => {
  const source = renderPrimaryNavigation('/schedule');
  const response = await normalizeShellNavigationLabels(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const html = await response.text();

  assert.match(html, /href="\/schedule" data-nav-key="schedule" aria-current="page" data-active="true"/);
  assert.match(html, /fd-mobile-dock__ball" aria-hidden="true">9<\/span>\s*<span>Schedule<\/span>/);
  assert.doesNotMatch(html, />Tonight<\/span>/);
});

test('shared shell output normalizes Schedule on normal and direct pages', async () => {
  for (const path of ['/schedule', '/admin']) {
    const response = await routerEntry.fetch(new Request(`https://fremontderby.test${path}`), {}, {});
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.match(html, /data-fd-mobile-dock/);
    assert.match(html, /href="\/schedule" data-nav-key="schedule"/);
    assert.doesNotMatch(html, />Tonight<\/span>/);
  }
});

test('navigation label normalizer leaves non-HTML responses untouched', async () => {
  const source = JSON.stringify({ ok: true, label: 'Tonight' });
  const response = await normalizeShellNavigationLabels(new Response(source, {
    headers: { 'content-type': 'application/json' },
  }));
  assert.equal(await response.text(), source);
});
