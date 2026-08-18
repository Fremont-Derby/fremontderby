import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

test('validate:gamma-rc runs validate-gamma-rc.mjs', () => {
  assert.equal(scripts['validate:gamma-rc'], 'node scripts/validate-gamma-rc.mjs');
});

test('lint template and inner-html scripts stay wired', () => {
  assert.equal(scripts['lint:templates'], 'node scripts/lint-template-regex.mjs');
  assert.equal(scripts['lint:inner-html'], 'node scripts/lint-inner-html.mjs');
});
