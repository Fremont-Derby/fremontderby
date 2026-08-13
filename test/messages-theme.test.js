import assert from 'node:assert/strict';
import test from 'node:test';

import { injectMessagesTheme, messagesThemeStyles } from '../src/messagesTheme.js';
import routerEntry from '../src/routerEntry.js';

test('Messages theme explicitly replaces legacy dark content surfaces with light tokens', () => {
  assert.match(messagesThemeStyles, /main\.app:has\(\[data-chat-layout\]\)/);
  assert.match(messagesThemeStyles, /color-scheme: light/);
  assert.match(messagesThemeStyles, /\.layout,[\s\S]*--fd-bg-surface/);
  assert.match(messagesThemeStyles, /\.threads[\s\S]*--fd-bg-subtle/);
  assert.match(messagesThemeStyles, /\.message\.mine[\s\S]*--fd-bg-accent-soft/);
  assert.match(messagesThemeStyles, /forced-colors: active/);
});

test('Messages theme injects only on chat HTML and only once', async () => {
  const chat = '<!doctype html><html><head></head><body><main class="app"><section data-chat-layout></section></main></body></html>';
  const first = await injectMessagesTheme(new Response(chat, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const firstHtml = await first.text();
  assert.equal((firstHtml.match(/data-fd-messages-theme/g) || []).length, 1);

  const second = await injectMessagesTheme(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.equal(((await second.text()).match(/data-fd-messages-theme/g) || []).length, 1);

  const plain = await injectMessagesTheme(new Response('<html><head></head><body>plain</body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.doesNotMatch(await plain.text(), /data-fd-messages-theme/);
});

test('runtime Messages page receives the light-theme convergence layer', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/messages'), {}, {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-messages-theme/);
  assert.match(html, /data-fd-design-system/);
  assert.match(html, /data-fd-accessibility-layer/);
});
