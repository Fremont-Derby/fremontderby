import assert from 'node:assert/strict';
import test from 'node:test';

import { accessibilityStyles, injectAccessibilityLayer } from '../src/accessibilityLayer.js';
import routerEntry from '../src/routerEntry.js';

function relativeLuminance(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map((part) => Number.parseInt(part, 16) / 255);
  const linear = rgb.map((channel) => (
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test('shared accessibility colors meet owned WCAG contrast targets', () => {
  assert.ok(contrastRatio('#171b19', '#ffffff') >= 4.5, 'body text on white');
  assert.ok(contrastRatio('#666b68', '#ffffff') >= 4.5, 'muted and placeholder text on white');
  assert.ok(contrastRatio('#096238', '#ffffff') >= 4.5, 'primary link text on white');
  assert.ok(contrastRatio('#096238', '#ffffff') >= 3, 'focus indicator on light surface');
  assert.ok(contrastRatio('#ffffff', '#06341f') >= 3, 'outer shell focus ring on felt');
  assert.ok(contrastRatio('#5e4b00', '#fff7d8') >= 4.5, 'warning text on warning surface');
  assert.ok(contrastRatio('#08733d', '#edf7f0') >= 4.5, 'success text on success surface');
  assert.ok(contrastRatio('#8f271f', '#fff0ed') >= 4.5, 'danger text on danger surface');
});

test('accessibility layer keeps dark styling shell-scoped and supports assistive display modes', () => {
  assert.match(accessibilityStyles, /main figure,[\s\S]*background-color: var\(--fd-bg-surface/);
  assert.match(accessibilityStyles, /input::placeholder,[\s\S]*--fd-placeholder/);
  assert.match(accessibilityStyles, /\.fd-shell a:focus-visible/);
  assert.match(accessibilityStyles, /prefers-reduced-motion: reduce/);
  assert.match(accessibilityStyles, /forced-colors: active/);
});

test('accessibility layer is injected once into HTML and not into JSON', async () => {
  const source = '<!doctype html><html><head></head><body>ok</body></html>';
  const first = await injectAccessibilityLayer(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const firstHtml = await first.text();
  assert.equal((firstHtml.match(/data-fd-accessibility-layer/g) || []).length, 1);

  const second = await injectAccessibilityLayer(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.equal(((await second.text()).match(/data-fd-accessibility-layer/g) || []).length, 1);

  const json = await injectAccessibilityLayer(new Response('{"ok":true}', {
    headers: { 'content-type': 'application/json' },
  }));
  assert.equal(await json.text(), '{"ok":true}');
});

test('canonical player pages receive both design and accessibility layers', async () => {
  for (const path of ['/', '/schedule', '/teams', '/scorecard', '/messages', '/profile', '/admin']) {
    const response = await routerEntry.fetch(new Request(`https://example.test${path}`), {}, {});
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /data-fd-design-system/, path);
    assert.match(html, /data-fd-accessibility-layer/, path);
  }
});
