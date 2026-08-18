import test from 'node:test';
import assert from 'node:assert/strict';
import { probeHtml } from '../scripts/assert-public-surface.mjs';
import { HTML_SHELL_MARKERS } from '../scripts/public-surface-contract.mjs';

test('probeHtml passes when status and shell markers are present', async () => {
  const html = `<!doctype html><html>${HTML_SHELL_MARKERS.join(' ')}</html>`;
  const fetchImpl = async () => ({ status: 200, text: async () => html });
  const result = await probeHtml('https://fremontderby.com', '/', fetchImpl);
  assert.equal(result.ok, true);
});

test('probeHtml fails when shell markers missing', async () => {
  const fetchImpl = async () => ({ status: 200, text: async () => '<!doctype html><html></html>' });
  const result = await probeHtml('https://fremontderby.com', '/', fetchImpl);
  assert.equal(result.ok, false);
  assert.match(result.error, /shell markers missing/);
});
