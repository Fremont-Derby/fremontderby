import test from 'node:test';
import assert from 'node:assert/strict';
import { renderChatPage } from '../src/chatPage.js';
import { applyJflChatScrollCss } from '../src/jflChatScrollFix.js';
import worker from '../src/personaRouterEntry.js';

test('JFL Messages CSS gets a bounded pane for wheel/trackpad scrolling', () => {
  const html = applyJflChatScrollCss(renderChatPage());
  assert.match(html, /\.layout \{ height: min\(720px, calc\(100vh - 160px\)\)/);
  assert.match(html, /max-height: calc\(100vh - 160px\)/);
  assert.match(html, /touch-action: pan-y/);
  assert.match(html, /\.chat \{ min-width: 0; min-height: 0; height: 100%/);
});

test('JFL /messages response includes the bounded layout', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/messages'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Messages · Fremont Derby/);
  assert.match(html, /touch-action: pan-y/);
  assert.match(html, /height: min\(720px, calc\(100vh - 160px\)\)/);
});
