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

test('Admin is discoverable from shared navigation without changing the five-item quick dock', async () => {
  const response = await routerEntry.fetch(new Request('https://fremontderby.test/admin'), {}, {});
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal((html.match(/href="\/admin" data-nav-key="admin"/g) || []).length, 2);
  assert.equal((html.match(/data-fd-mobile-dock[^>]*>[\s\S]*?<\/nav>/g) || []).length, 1);
  const dock = html.match(/<nav class="fd-mobile-dock"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.equal((dock.match(/data-nav-key=/g) || []).length, 5);
  assert.doesNotMatch(dock, /data-nav-key="admin"/);
});

test('Admin shared navigation has deterministic active state on the Admin gateway', async () => {
  const response = await routerEntry.fetch(new Request('https://fremontderby.test/admin'), {}, {});
  const html = await response.text();

  assert.equal((html.match(/href="\/admin" data-nav-key="admin" aria-current="page" data-active="true">Admin<\/a>/g) || []).length, 2);
});

test('navigation label normalizer leaves non-HTML responses untouched', async () => {
  const source = JSON.stringify({ ok: true, label: 'Tonight' });
  const response = await normalizeShellNavigationLabels(new Response(source, {
    headers: { 'content-type': 'application/json' },
  }));
  assert.equal(await response.text(), source);
});
