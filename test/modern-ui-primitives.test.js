import test from 'node:test';
import assert from 'node:assert/strict';

import router from '../src/routerEntry.js';
import { designSystemStyles } from '../src/designSystem.js';
import { renderModernUiCatalog } from '../src/modernUiCatalog.js';
import { modernUiPrimitiveStyles } from '../src/modernUiPrimitives.js';
import { siteStyles } from '../src/siteStyles.js';

const REQUIRED_PRIMITIVES = [
  'page-header',
  'eyebrow',
  'card',
  'list-row',
  'status',
  'segmented-control',
  'action',
  'empty-state',
  'error-state',
  'match-row',
  'person-row',
  'score-panel',
  'rack-ledger',
];

const REQUIRED_CLASSES = [
  '.fd-page-header',
  '.fd-eyebrow',
  '.fd-card',
  '.fd-list-row',
  '.fd-status',
  '.fd-segmented',
  '.fd-action',
  '.fd-empty-state',
  '.fd-error-state',
  '.fd-match-row',
  '.fd-person-row',
  '.fd-score-panel',
  '.fd-rack-ledger',
];

test('modern UI catalog exposes every Onion 1 primitive with semantic markup', () => {
  const html = renderModernUiCatalog();

  assert.match(html, /data-fd-ui-catalog="modern-v1"/);
  for (const primitive of REQUIRED_PRIMITIVES) {
    assert.match(
      html,
      new RegExp(`data-fd-primitive=["']${primitive}["']`),
      `missing catalog primitive ${primitive}`,
    );
  }

  assert.match(html, /<header[^>]+data-fd-primitive="page-header"/i);
  assert.match(html, /<button[^>]+class="[^"]*fd-action[^"]*fd-action--primary/i);
  assert.match(html, /<button[^>]+class="[^"]*fd-action[^"]*fd-action--secondary/i);
  assert.match(html, /<button[^>]+class="[^"]*fd-action[^"]*fd-action--danger/i);
  assert.match(html, /role="status"/i);
  assert.match(html, /role="alert"/i);
  assert.match(html, /aria-label="View sample"/i);
  assert.match(html, /aria-pressed="true"/i);
});

test('shared Fremont site design system defines the modern primitives and accessibility contracts', () => {
  for (const className of REQUIRED_CLASSES) {
    assert.match(
      siteStyles,
      new RegExp(className.replace('.', '\\.') + '(?:[\\s,{:]|$)'),
      `missing shared style ${className}`,
    );
  }

  assert.match(designSystemStyles, /--fd-control-min:\s*(?:4[4-9]|[5-9]\d)px/);
  assert.match(designSystemStyles, /:focus-visible/);
  assert.match(designSystemStyles, /@media\s*\(forced-colors:\s*active\)/);
  assert.match(modernUiPrimitiveStyles, /\.fd-action[\s\S]*min-height:\s*var\(--fd-control-min\)/);
  assert.match(modernUiPrimitiveStyles, /\.fd-segmented[\s\S]*min-height:\s*var\(--fd-control-min\)/);
  assert.match(modernUiPrimitiveStyles, /@media\s*\(forced-colors:\s*active\)/);
});

test('modern catalog remains Fremont-native with no Amazon or Rio runtime/assets', () => {
  const combined = `${renderModernUiCatalog()}\n${siteStyles}`;
  assert.doesNotMatch(combined, /@amzn|amazon ember|sds-core|rio[-_ ](?:token|design|component)/i);
  assert.match(combined, /var\(--fd-/);
});

test('JFL serves the modern catalog while other environments fail closed', async () => {
  const jflResponse = await router.fetch(
    new Request('https://jfl.fremontderby.com/design-system'),
    { ENVIRONMENT: 'jfl' },
    {},
  );
  assert.equal(jflResponse.status, 200);
  assert.equal(jflResponse.headers.get('x-fremont-ui-catalog'), 'modern-v1');
  const jflHtml = await jflResponse.text();
  assert.match(jflHtml, /data-fd-ui-catalog="modern-v1"/);
  assert.match(jflHtml, /data-fd-shell/);
  assert.match(jflHtml, /data-fd-design-system/);

  for (const environment of ['production', 'gamma', 'dru']) {
    const response = await router.fetch(
      new Request('https://example.test/design-system'),
      { ENVIRONMENT: environment },
      {},
    );
    assert.equal(response.status, 404, `${environment} must not expose the JFL catalog`);
  }
});
