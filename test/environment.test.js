import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Worker root and named environments are explicit and non-preview', () => {
  const config = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));

  assert.ok(
    ['production', 'jfl', 'dru', 'gamma'].includes(config.vars.ENVIRONMENT),
    `unexpected root Worker environment: ${config.vars.ENVIRONMENT}`,
  );
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);

  assert.equal(config.env.staging.vars.ENVIRONMENT, 'staging');
  assert.equal(config.env.staging.workers_dev, false);
  assert.equal(config.env.staging.preview_urls, false);

  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(config.env[lane].vars.ENVIRONMENT, lane);
    assert.equal(config.env[lane].workers_dev, false);
    assert.equal(config.env[lane].preview_urls, false);
  }
});

test('local secret files and build output are ignored by git', () => {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');

  for (const required of ['node_modules/', 'dist/', '.wrangler/', '.dev.vars', '.env']) {
    assert.match(gitignore, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
