import test from 'node:test';
import assert from 'node:assert/strict';
import { inboxPolishLine, menuDismissLine } from '../src/pathLine.js';
import { renderProfilePage } from '../src/profilePage.js';

test('the inbox order and the outside menu dismiss are named', () => {
  assert.equal(inboxPolishLine({ order: 'newest' }), 'Inbox: newest message first.');
  assert.equal(menuDismissLine({ dock: true }), 'Menu closes outside the dock. Dock stays lit.');
  const html = renderProfilePage();
  assert.doesNotMatch(html, /Inbox: newest message first/);
  assert.doesNotMatch(html, /Menu closes outside the dock. Dock stays lit/);
});
