import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(
  fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
);

test('production and staging expose isolated public Supabase browser config', () => {
  assert.equal(config.vars.ENVIRONMENT, 'production');
  assert.match(config.vars.SUPABASE_URL, /cpiucsxlkicmlbvdvhww\.supabase\.co$/);
  assert.match(config.vars.SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/);

  const staging = config.env.staging.vars;
  assert.equal(staging.ENVIRONMENT, 'staging');
  assert.match(staging.SUPABASE_URL, /oqkkvqkerusepyokzbmt\.supabase\.co$/);
  assert.match(staging.SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/);

  assert.notEqual(config.vars.SUPABASE_URL, staging.SUPABASE_URL);
  assert.notEqual(config.vars.SUPABASE_PUBLISHABLE_KEY, staging.SUPABASE_PUBLISHABLE_KEY);
  assert.equal('SUPABASE_SERVICE_ROLE_KEY' in config.vars, false);
  assert.equal('SUPABASE_SERVICE_ROLE_KEY' in staging, false);
});
