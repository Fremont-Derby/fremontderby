import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('hourly-live-probe covers core public and health paths', () => {
  const source = readFileSync('scripts/hourly-live-probe.mjs', 'utf8');
  for (const path of ['/', '/schedule', '/teams', '/scorecard', '/standings', '/admin', '/health', '/health/environment']) {
    assert.match(source, new RegExp(`'${path.replace(/\//g, '\\/')}'`));
  }
  assert.match(source, /PROBE_HOST/);
  assert.match(source, /PROBE_DRU/);
  assert.match(source, /PROBE_JFL/);
  assert.match(source, /PROBE_GAMMA/);
});
