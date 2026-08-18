import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('ci.yml uses node-version 22', () => {
  const yml = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(yml, /node-version:\s*22/);
  assert.doesNotMatch(yml, /node-version:\s*1[68]/);
});

test('ci.yml default permissions are contents read', () => {
  const yml = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(yml, /permissions:\s*\n\s*contents:\s*read/);
});
