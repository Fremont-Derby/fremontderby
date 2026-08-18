import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('ci.yml includes required job ids and display names', () => {
  const yml = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(yml, /name: CI/);
  assert.match(yml, /\btest:\s*\n\s*name: test/);
  assert.match(yml, /\baccessibility:\s*\n\s*name: accessibility/);
  assert.match(yml, /\btest-season1:/);
  assert.match(yml, /\bdeploy-nonproduction:/);
  assert.match(yml, /\bproduction-smoke:/);
});

test('ci.yml never deploys on pull_request for nonproduction', () => {
  const yml = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(yml, /github\.event_name == 'push'/);
  assert.match(yml, /github\.event\.pull_request == null/);
});
