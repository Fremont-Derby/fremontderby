import assert from 'node:assert/strict';
import test from 'node:test';

import { injectMessagesTheme, messagesSimplifierScript, messagesThemeStyles } from '../src/messagesTheme.js';
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
  assert.equal((firstHtml.match(/data-fd-messages-simplifier/g) || []).length, 1);

  const second = await injectMessagesTheme(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.equal(((await second.text()).match(/data-fd-messages-theme/g) || []).length, 1);

  const plain = await injectMessagesTheme(new Response('<html><head></head><body>plain</body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.doesNotMatch(await plain.text(), /data-fd-messages-theme/);
});

test('normal Messages navigation is limited to General, Direct, and Team', () => {
  assert.match(messagesSimplifierScript, /\['League rooms', 'General'\]/);
  assert.match(messagesSimplifierScript, /\['Player messages', 'Direct'\]/);
  assert.match(messagesSimplifierScript, /\['Team chats', 'Team'\]/);
  assert.match(messagesSimplifierScript, /text === 'Matchup rooms'/);
  assert.match(messagesSimplifierScript, /data-thread-key\^="matchup:"/);
  assert.match(messagesSimplifierScript, /group\.label === 'Matchup rooms'/);
  assert.match(messagesSimplifierScript, /group\.remove\(\)/);
});

test('mobile Messages replaces the giant native picker with conversation rows', () => {
  assert.match(messagesThemeStyles, /\[data-thread-select\][\s\S]*display: none !important/);
  assert.match(messagesThemeStyles, /\.fd-mobile-inbox/);
  assert.match(messagesSimplifierScript, /className = 'fd-mobile-inbox'/);
  assert.match(messagesSimplifierScript, /clone\.addEventListener\('click'/);
  assert.match(messagesSimplifierScript, /child\.click\(\)/);
  assert.match(messagesSimplifierScript, /new MutationObserver\(\(\) => requestAnimationFrame\(simplifyMessages\)\)/);
});

test('runtime Messages page receives the light-theme convergence and simplification layers', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/messages'), {}, {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-messages-theme/);
  assert.match(html, /data-fd-messages-simplifier/);
  assert.match(html, /data-fd-design-system/);
  assert.match(html, /data-fd-accessibility-layer/);
});


test('Messages polish keeps one obvious General conversation and removes QA clutter', () => {
  assert.match(messagesSimplifierScript, /leagueThreads\.slice\(1\)/);
  assert.match(messagesSimplifierScript, /options\.slice\(1\)/);
  assert.match(messagesSimplifierScript, /qaFixtureName/);
  assert.match(messagesSimplifierScript, /Persona Test/);
  assert.match(messagesSimplifierScript, /group\.label === 'Team'/);
});

test('mobile Messages exposes the three product choices and clears the fixed dock', () => {
  assert.match(messagesSimplifierScript, /sectionOrder = \['General', 'Direct', 'Team'\]/);
  assert.match(messagesSimplifierScript, /Message a player/);
  assert.match(messagesSimplifierScript, /Start a private conversation/);
  assert.match(messagesSimplifierScript, /Message a person, talk to your team, or talk to the league\./);
  assert.match(messagesSimplifierScript, /Admin: review reports/);
  assert.match(messagesThemeStyles, /fd-moderation-link/);
  assert.match(messagesThemeStyles, /padding-bottom: calc\(96px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(messagesThemeStyles, /\[data-mobile-new\][\s\S]*display: none !important/);
});
