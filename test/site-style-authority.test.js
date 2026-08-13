import assert from 'node:assert/strict';
import test from 'node:test';

import routerEntry from '../src/routerEntry.js';
import { siteStyles } from '../src/siteStyles.js';
import { renderIntroPage } from '../src/publicPages.js';

test('public page CSS cannot style shared navigation generically', () => {
  const html = renderIntroPage();
  assert.match(html, /<main class="public-page">/);
  assert.doesNotMatch(html, /\n\s*nav\s*\{/);
  assert.doesNotMatch(html, /\n\s*nav a\s*,/);
  assert.doesNotMatch(html, /aria-label="Main navigation"/);
});

test('canonical site styles explicitly own shell contrast and active state', () => {
  assert.match(siteStyles, /\.fd-shell \.fd-nav a \{[\s\S]*color: #eff8f2 !important/);
  assert.match(siteStyles, /\.fd-shell \.fd-nav a\[aria-current="page"\] \{[\s\S]*background: #ffffff !important;[\s\S]*color: var\(--fd-green-950\) !important/);
  assert.match(siteStyles, /\.fd-nav-menu summary \{[\s\S]*background: rgba\(0,0,0,.14\) !important;[\s\S]*color: #ffffff !important/);
});

test('canonical mobile dock owns geometry instead of inheriting page nav styles', () => {
  assert.match(siteStyles, /@media \(max-width: 760px\) \{[\s\S]*\.fd-mobile-dock \{[\s\S]*position: fixed !important/);
  assert.match(siteStyles, /\.fd-mobile-dock \{[\s\S]*margin: 0 !important;[\s\S]*padding: 6px !important;[\s\S]*border: 1px solid var\(--fd-border\) !important/);
});

test('ordinary shared surfaces use one complete visual contract', () => {
  assert.match(siteStyles, /\.card, \.panel, \.hero[\s\S]*border: 1px solid var\(--fd-border\) !important;[\s\S]*border-radius: var\(--fd-radius\) !important;[\s\S]*box-shadow: var\(--fd-shadow-soft\) !important/);
});

test('Home receives the canonical dock and final site style contract', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/'), {}, {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-mobile-dock/);
  assert.match(html, /data-fd-design-system/);
  assert.match(html, /\.fd-mobile-dock \{[\s\S]*margin: 0 !important/);
  assert.doesNotMatch(html, /<nav aria-label="Main navigation">/);
});
