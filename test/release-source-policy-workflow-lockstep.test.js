import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('release-source-policy targets main and gamma only', () => {
  const yml = readFileSync('.github/workflows/release-source-policy.yml', 'utf8');
  assert.match(yml, /branches:\s*\[main, fremontderby-gamma\]/);
  assert.match(yml, /STRICT_RELEASE_SOURCE_POLICY:\s*'1'/);
  assert.match(yml, /check-release-source-policy\.mjs/);
});

test('release-source-policy has no deploy secrets', () => {
  const yml = readFileSync('.github/workflows/release-source-policy.yml', 'utf8');
  assert.doesNotMatch(yml, /CLOUDFLARE_/);
  assert.doesNotMatch(yml, /SUPABASE_/);
});
