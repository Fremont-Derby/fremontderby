import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadWrangler() {
  const raw = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const json = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(json);
}

test('top-level Worker is production fremontderby', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.name, 'fremontderby');
  assert.equal(cfg.vars.ENVIRONMENT, 'production');
});

test('release lane env keys exist', () => {
  const cfg = loadWrangler();
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.ok(cfg.env[lane], lane);
    assert.equal(cfg.env[lane].vars.ENVIRONMENT, lane);
    assert.equal(cfg.env[lane].name, `fremontderby-${lane}`);
  }
});

test('lane workers_dev and preview_urls stay disabled', () => {
  const cfg = loadWrangler();
  assert.equal(cfg.workers_dev, false);
  assert.equal(cfg.preview_urls, false);
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(cfg.env[lane].workers_dev, false);
    assert.equal(cfg.env[lane].preview_urls, false);
  }
});
