import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('ci.yml pull_request and push include permanent lane branches', () => {
  const yml = readFileSync('.github/workflows/ci.yml', 'utf8');
  for (const branch of ['main', 'fremontderby-gamma', 'fremontderby-jfl', 'fremontderby-dru']) {
    assert.match(yml, new RegExp(branch));
  }
});

test('ci.yml deploy-nonproduction only on permanent lane push refs', () => {
  const yml = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(yml, /refs\/heads\/fremontderby-jfl/);
  assert.match(yml, /refs\/heads\/fremontderby-dru/);
  assert.match(yml, /refs\/heads\/fremontderby-gamma/);
  assert.match(yml, /github\.event_name == 'push'/);
});
