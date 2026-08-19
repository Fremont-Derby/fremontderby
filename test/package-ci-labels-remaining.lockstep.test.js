import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('package a11y/build/check/dev/do-work scripts keep pure entrypoints', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const s = pkg.scripts || {};
  assert.equal(s.a11y, 'node scripts/pa11y-rendered.mjs');
  assert.equal(s.build, 'npx wrangler deploy --dry-run --env="" --outdir dist');
  assert.equal(s.check, 'node scripts/check-js-syntax.mjs');
  assert.equal(s['check:epic-status'], 'node scripts/check-parent-epic-drift.mjs');
  assert.equal(s.dev, 'npx wrangler dev');
  assert.equal(s['do-work:check'], 'npm run canary:contract && npm run canary');
  for (const rel of [
    'scripts/pa11y-rendered.mjs',
    'scripts/check-js-syntax.mjs',
    'scripts/check-parent-epic-drift.mjs',
  ]) {
    assert.ok(existsSync(join(root, rel)), `${rel} must exist`);
  }
});

test('canary:contract runs a non-empty pure test file list', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const cmd = pkg.scripts['canary:contract'] || '';
  assert.ok(cmd.startsWith('node --test '));
  const files = cmd.replace(/^node --test\s+/, '').split(/\s+/).filter(Boolean);
  assert.ok(files.length >= 2, 'canary:contract must list at least two test files');
  for (const file of files) {
    assert.ok(existsSync(join(root, file)), `${file} listed by canary:contract must exist`);
  }
});

test('collaboration-labels manifest exists and labels:check is wired', () => {
  assert.ok(existsSync(join(root, '.github/collaboration-labels.json')));
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['labels:check'], 'node scripts/collaboration-labels.mjs --check');
  assert.ok(existsSync(join(root, 'scripts/collaboration-labels.mjs')));
  const labels = JSON.parse(readFileSync(join(root, '.github/collaboration-labels.json'), 'utf8'));
  assert.ok(Array.isArray(labels) ? labels.length > 0 : Object.keys(labels).length > 0);
});

test('CI required job names remain test, accessibility, and test-season1', () => {
  const src = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.ok(/name:\s*test\b/.test(src));
  assert.ok(/name:\s*accessibility\b/.test(src));
  assert.ok(/test-season1:/.test(src));
  assert.ok(src.includes('npm run lint'));
  assert.ok(src.includes('npm run check'));
  assert.ok(src.includes('npm run labels:check'));
  assert.ok(src.includes('npm test') || src.includes('npm run test'));
  assert.ok(src.includes('npm run build'));
  assert.ok(src.includes('npm run test:season1'));
  assert.ok(src.includes('npm run test:floor') || src.includes('count-tests.mjs'));
});
