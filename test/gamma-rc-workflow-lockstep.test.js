import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('gamma-rc-validation defaults to gamma host and strict source on PR', () => {
  const yml = readFileSync('.github/workflows/gamma-rc-validation.yml', 'utf8');
  assert.match(yml, /https:\/\/gamma\.fremontderby\.com/);
  assert.match(yml, /validate-gamma-rc\.mjs/);
  assert.match(yml, /STRICT_RELEASE_SOURCE_POLICY:\s*'1'/);
  assert.match(yml, /check-release-source-policy\.mjs/);
  assert.doesNotMatch(yml, /CLOUDFLARE_/);
});
