import test from 'node:test';
import assert from 'node:assert/strict';

import { designSystemStyles } from '../src/designSystem.js';
import { renderPrimaryNavigation } from '../src/appShell.js';
import { renderChatPage } from '../src/chatPage.js';

test('shared shell navigation and message preview actions meet the touch-target floor', () => {
  const nav = renderPrimaryNavigation('/messages');

  assert.match(nav, /class="fd-message-indicator"/);
  assert.match(nav, /class="fd-message-preview__all"/);
  assert.match(nav, /<summary aria-label="Menu">Menu<\/summary>/);
  assert.match(designSystemStyles, /\.fd-shell \.fd-nav a \{ min-height: 44px !important/);
  assert.match(designSystemStyles, /\.fd-message-indicator \{ width: 44px !important; height: 44px !important/);
  assert.match(designSystemStyles, /\.fd-message-indicator, \.fd-nav-menu summary \{[\s\S]*min-height: 44px !important/);
  assert.match(designSystemStyles, /\.fd-message-preview__all \{ min-height: 44px !important/);
});

test('Messages high-frequency compact actions are at least 44px after shared styling', () => {
  const html = renderChatPage();

  assert.match(html, /class="panel-actions"/);
  assert.match(html, /class="block"/);
  assert.match(html, /class="older"/);
  assert.match(html, /class="report"/);
  assert.match(designSystemStyles, /\.layout \.panel-actions button, \.layout \.block, \.layout \.older, \.layout \.report \{[\s\S]*min-height: 44px !important/);
});

test('touch-target controls retain visible focus and forced-colors boundaries', () => {
  assert.match(designSystemStyles, /a:focus-visible, button:focus-visible/);
  assert.match(designSystemStyles, /@media \(forced-colors: active\)/);
  assert.match(designSystemStyles, /border: 1px solid ButtonText !important/);
});
