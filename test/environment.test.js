import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('staging and production Worker environments are explicit and distinct', () => {
  const config = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));

  assert.equal(config.vars.ENVIRONMENT, 'production');
  assert.equal(config.env.staging.vars.ENVIRONMENT, 'staging');
  assert.equal(config.env.staging.workers_dev, true);
  assert.notEqual(config.vars.ENVIRONMENT, config.env.staging.vars.ENVIRONMENT);
});

test('local secret files and build output are ignored by git', () => {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');

  for (const required of ['node_modules/', 'dist/', '.wrangler/', '.dev.vars', '.env']) {
    assert.match(gitignore, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
