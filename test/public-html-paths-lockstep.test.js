import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_HTML_PATHS } from '../scripts/public-surface-contract.mjs';

test('PUBLIC_HTML_PATHS includes core public routes', () => {
  assert.equal(Object.isFrozen(PUBLIC_HTML_PATHS), true);
  for (const path of ['/', '/standings', '/schedule', '/teams', '/scorecard', '/admin', '/demo', '/trades']) {
    assert.ok(PUBLIC_HTML_PATHS.includes(path), path);
  }
  assert.ok(PUBLIC_HTML_PATHS.length >= 10);
});
