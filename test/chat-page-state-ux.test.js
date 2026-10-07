import assert from 'node:assert/strict';
import test from 'node:test';

import { renderChatPage } from '../src/chatPage.js';

test('Messages starts in an honest loading state with accessible status semantics', () => {
  const html = renderChatPage();

  assert.match(html, /role="status" aria-live="polite" aria-atomic="true">Checking your messages…/);
  assert.doesNotMatch(html, /data-status>Ready</);
});

test('Messages gives signed-out and expired-session users a prominent recovery action', () => {
  const html = renderChatPage();

  assert.match(html, /Coordinate league night in one place/);
  assert.match(html, /Sign in to message/);
  assert.match(html, /href="\/profile"/);
  assert.match(html, /Your sign-in expired/);
  assert.match(html, /Your messages were not changed/);
});

test('Messages empty states lead to a useful league-night action', () => {
  const html = renderChatPage();

  assert.match(html, /No conversations yet/);
  assert.match(html, /Start a player message/);
  assert.match(html, /Open Teams/);
  assert.match(html, /See tonight/);
  assert.match(html, /No eligible players to message/);
  assert.match(html, /No other registered players are available to message yet/);
});

test('Messages load failure is prominent, retryable, and implementation-safe', () => {
  const html = renderChatPage();

  assert.match(html, /Couldn’t load messages/);
  assert.match(html, /Try again/);
  assert.match(html, /friendlyFailure/);
  assert.match(html, /supabase\|bearer\|uuid\|rpc\|permission denied\|schema private\|postgres\|request failed/i);
});

test('Messages recovery controls retain mobile touch and keyboard focus affordances', () => {
  const html = renderChatPage();

  assert.match(html, /\.state-action \{ min-height: 44px/);
  assert.match(html, /button:focus-visible, textarea:focus-visible, select:focus-visible, a:focus-visible/);
  assert.match(html, /@media \(max-width: 760px\)/);
  assert.match(html, /\.state-actions, \.state-actions a, \.state-actions button \{ width: 100%; \}/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
});
