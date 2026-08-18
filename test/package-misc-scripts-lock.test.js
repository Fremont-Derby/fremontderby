import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

test('a11y and syntax check scripts stay wired', () => {
  assert.equal(scripts.a11y, 'node scripts/pa11y-rendered.mjs');
  assert.equal(scripts.check, 'node scripts/check-js-syntax.mjs');
  assert.equal(scripts['check:epic-status'], 'node scripts/check-parent-epic-drift.mjs');
});

test('build and dev use wrangler', () => {
  assert.match(scripts.build, /wrangler deploy --dry-run/);
  assert.equal(scripts.dev, 'npx wrangler dev');
});

test('do-work:check chains contract then live canary', () => {
  assert.equal(scripts['do-work:check'], 'npm run canary:contract && npm run canary');
});
