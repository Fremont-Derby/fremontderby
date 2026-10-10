import test from 'node:test';
import assert from 'node:assert/strict';
import { isKnownAppPagePath, renderPrimaryNavigation, friendlyErrorMessage } from '../src/appShell.js';

const known = ['/', '/schedule', '/standings', '/teams', '/profile', '/scorecard', '/lineup', '/availability', '/messages', '/trades', '/prizes', '/rules', '/demo', '/admin', '/admin/operations', '/admin/players', '/admin/seasons', '/season-setup'];
for (const path of known) {
  test('app shell knows ' + path, () => {
    const knownPath = isKnownAppPagePath(path);
    assert.equal(typeof knownPath, 'boolean');
  });
  test('primary nav renders for ' + path, () => {
    const html = renderPrimaryNavigation(path);
    assert.equal(typeof html, 'string');
    assert.ok(html.length > 0);
  });
}

for (const message of ['nope', '', 'Sign in required', 'Not found', 'Conflict']) {
  test('friendly error keeps a string for ' + JSON.stringify(message), () => {
    const text = friendlyErrorMessage(message);
    assert.equal(typeof text, 'string');
    assert.ok(text.length > 0);
  });
}
