import assert from 'node:assert/strict';
import test from 'node:test';

import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

test('admin players inline script parses so the directory can leave Checking admin access', () => {
  const html = renderAdminPlayersPage();
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'admin players inline script exists');
  assert.doesNotThrow(() => new Function(match[1]), 'admin players inline script must be valid JavaScript');
  assert.match(match[1], /load\(\)\.catch/, 'directory startup must be wired');
});
