import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlShellOk } from '../scripts/assert-public-surface.mjs';
import { HTML_SHELL_MARKERS } from '../scripts/public-surface-contract.mjs';

test('htmlShellOk requires doctype and all shell markers', () => {
  const good = `<!doctype html><html>${HTML_SHELL_MARKERS.join('')}</html>`;
  assert.equal(htmlShellOk(good), true);
  assert.equal(htmlShellOk('<html>no doctype</html>'), false);
  assert.equal(htmlShellOk('<!doctype html><html></html>'), false);
});
