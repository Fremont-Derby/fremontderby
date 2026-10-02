import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/seed-jfl-two-captain.yml', import.meta.url), 'utf8');
const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

test('JFL fixture workflow guards the staging project and rejects production', () => {
  assert.match(config, /"SUPABASE_URL": "https:\/\/oqkkvqkerusepyokzbmt\.supabase\.co"/);
  assert.match(workflow, /identity\.includes\("oqkkvqkerusepyokzbmt"\)/);
  assert.match(workflow, /identity\.includes\("cpiucsxlkicmlbvdvhww"\)/);
  assert.match(workflow, /Refusing the production database project/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/fremontderby-jfl'/);
  assert.match(workflow, /runs-on: ubuntu-latest/);
  assert.doesNotMatch(workflow, /pull_request:/);
});
