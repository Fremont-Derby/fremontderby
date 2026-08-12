import assert from 'node:assert/strict';
import test from 'node:test';

import { accessibilityScript, accessibilityStyles, injectAccessibilityLayer } from '../src/accessibilityLayer.js';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';

test('Season Teams keeps the authoritative entry reason on an unavailable slot action', () => {
  const html = renderAdminSeasonTeamsPage();

  assert.match(html, /const reason=normalized\(row,'entryReason'\)/);
  assert.match(html, /button\.disabled=!Boolean\(normalized\(row,'canTakeSlot'\)\)/);
  assert.match(html, /if\(button\.disabled&&reason\)button\.title=reason/);
  assert.match(html, /Assign captain/);
  assert.match(html, /Add players/);
});

test('shared accessibility layer promotes disabled tooltip reasons into visible adjacent notes', async () => {
  assert.match(accessibilityStyles, /\.fd-disabled-reason/);
  assert.match(accessibilityStyles, /overflow-wrap:\s*anywhere/);
  assert.match(accessibilityScript, /button\[disabled\]\[title\]/);
  assert.match(accessibilityScript, /insertAdjacentElement\('afterend', note\)/);
  assert.match(accessibilityScript, /note\.textContent = reason/);
  assert.match(accessibilityScript, /setAttribute\('aria-describedby'/);
  assert.match(accessibilityScript, /MutationObserver/);

  const response = await injectAccessibilityLayer(new Response('<!doctype html><html><head></head><body><main></main></body></html>', {
    headers: {'content-type': 'text/html; charset=utf-8'},
  }));
  const html = await response.text();

  assert.match(html, /data-fd-accessibility-layer/);
  assert.match(html, /data-fd-disabled-reasons/);
  assert.match(html, /fd-disabled-reason/);
  assert.match(html, /aria-describedby/);
});

test('shared disabled-reason behavior leaves enabled actions without warning copy', () => {
  assert.match(accessibilityScript, /if \(!control\.matches\(':disabled'\) \|\| !reason\)/);
  assert.match(accessibilityScript, /removeReason\(control\)/);
});
