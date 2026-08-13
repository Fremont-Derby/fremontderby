import assert from 'node:assert/strict';
import test from 'node:test';

import {
  injectMobileMenuAccessibility,
  mobileMenuScript,
  mobileMenuStyles,
} from '../src/mobileMenuAccessibility.js';

function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((part) => parseInt(part, 16) / 255);
  const linear = channels.map((value) => (
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

test('mobile drawer explicitly overrides dark-shell link color at sufficient specificity', () => {
  assert.match(mobileMenuStyles, /\.fd-shell \.fd-nav--mobile a\s*\{/);
  assert.match(mobileMenuStyles, /color: var\(--fd-text, #171b19\) !important/);
  assert.match(mobileMenuStyles, /opacity: 1 !important/);
  assert.ok(contrast('#171b19', '#ffffff') >= 4.5);
});

test('current mobile destination is explicit beyond color and remains touch friendly', () => {
  assert.match(mobileMenuStyles, /\.fd-shell \.fd-nav--mobile a\[aria-current="page"\]/);
  assert.match(mobileMenuStyles, /content: 'Current'/);
  assert.match(mobileMenuStyles, /box-shadow: inset 4px 0 0/);
  assert.match(mobileMenuStyles, /min-height: 44px !important/);
  assert.ok(contrast('#06341f', '#e8f3ec') >= 4.5);
});

test('open mobile drawer visually wins over and disables the competing quick dock', () => {
  assert.match(mobileMenuStyles, /\.fd-shell:has\(\.fd-nav-menu\[open\]\) \{ z-index: 1200; \}/);
  assert.match(mobileMenuStyles, /\.fd-shell:has\(\.fd-nav-menu\[open\]\) \+ \.fd-mobile-dock/);
  assert.match(mobileMenuStyles, /pointer-events: none/);
  assert.match(mobileMenuScript, /dock\.inert = open/);
});

test('mobile drawer moves focus inside on open and Escape returns focus to Menu', () => {
  assert.match(mobileMenuScript, /drawer\.querySelector\('a'\)\?\.focus\(\)/);
  assert.match(mobileMenuScript, /event\.key !== 'Escape'/);
  assert.match(mobileMenuScript, /menu\.open = false/);
  assert.match(mobileMenuScript, /summary\.focus\(\)/);
});

test('forced-colors keeps ordinary and current menu destinations distinguishable', () => {
  assert.match(mobileMenuStyles, /@media \(forced-colors: active\)/);
  assert.match(mobileMenuStyles, /color: LinkText !important/);
  assert.match(mobileMenuStyles, /border: 2px solid Highlight !important/);
});

test('mobile menu accessibility layer is injected only into HTML', async () => {
  const source = '<!doctype html><html><head><title>Menu</title></head><body><main>Page</main></body></html>';
  const htmlResponse = await injectMobileMenuAccessibility(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const html = await htmlResponse.text();
  assert.equal((html.match(/data-fd-mobile-menu-accessibility/g) || []).length, 2);
  assert.match(html, /\.fd-shell \.fd-nav--mobile a/);
  assert.match(html, /dock\.inert = open/);

  const json = JSON.stringify({ ok: true });
  const jsonResponse = await injectMobileMenuAccessibility(new Response(json, {
    headers: { 'content-type': 'application/json' },
  }));
  assert.equal(await jsonResponse.text(), json);
  assert.doesNotMatch(await injectMobileMenuAccessibility(new Response(json)).then((response) => response.text()), /data-fd-mobile-menu-accessibility/);
});
