import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/seed-jfl-two-captain.yml', import.meta.url), 'utf8');
const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const apply = readFileSync(new URL('../scripts/apply-jfl-two-captain.mjs', import.meta.url), 'utf8');

test('JFL fixture workflow guards the staging project and rejects production', () => {
  assert.match(config, /"SUPABASE_URL": "https:\/\/oqkkvqkerusepyokzbmt\.supabase\.co"/);
  assert.match(apply, /const stagingRef = 'oqkkvqkerusepyokzbmt'/);
  assert.match(apply, /const productionRef = 'cpiucsxlkicmlbvdvhww'/);
  assert.match(apply, /Refusing the production database project/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/fremontderby-jfl'/);
  assert.match(workflow, /runs-on: ubuntu-latest/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.match(workflow, /secrets\.SUPABASE_ACCESS_TOKEN2/);
  assert.doesNotMatch(workflow, /GAMMA_DATABASE_URL|PRODUCTION_DATABASE_URL/);
  assert.match(apply, /read_only: readOnly/);
  assert.doesNotMatch(apply, /console\.log\(.*token|JSON\.stringify\(body\)/);
});
