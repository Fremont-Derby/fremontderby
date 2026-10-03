import test from 'node:test';
import assert from 'node:assert/strict';
import { publicSurfaceFailure } from '../src/publicSurfaceFailure.js';
import { failedSurfaceLine } from '../src/publicSurfaceTheme.js';

test('a failed public surface check names the page and status', () => {
  assert.equal(publicSurfaceFailure({ ok: false, name: 'DRU schedule', status: 500 }), 'DRU schedule returned 500.');
  assert.equal(publicSurfaceFailure({ ok: true, name: 'DRU schedule', status: 200 }), '');
  assert.equal(failedSurfaceLine, 'DRU schedule returned 500.');
});
