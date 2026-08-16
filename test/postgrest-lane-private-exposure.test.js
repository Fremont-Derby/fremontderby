import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('shared staging exposes lane private schemas to PostgREST', () => {
  const sql = readFileSync(
    join(root, 'supabase/migrations/20260814093000_expose_lane_private_postgrest_schemas.sql'),
    'utf8',
  );
  assert.match(sql, /jfl_private/);
  assert.match(sql, /dru_private/);
  assert.match(sql, /gamma_private/);
  assert.match(sql, /reload config/);
  assert.match(sql, /reload schema/);
});

test('supabaseSchema maps private profile to lane_private', () => {
  const src = readFileSync(join(root, 'src/supabaseSchema.js'), 'utf8');
  assert.match(src, /requestedProfile === 'private'/);
  assert.match(src, /\$\{schema\}_private/);
});
