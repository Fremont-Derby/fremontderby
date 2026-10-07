import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const reset = await readFile(new URL('../scripts/reset-jfl-two-captain.sql', import.meta.url), 'utf8');
const fixtureId = '18580000-1300-4000-8000-000000000001';

test('two-captain reset fails closed on the exact isolated JFL QA fixture', () => {
  assert.match(reset, /^begin;/m);
  assert.match(reset, /to_regnamespace\('jfl'\).*to_regnamespace\('jfl_private'\)/s);
  assert.match(reset, /s\.purpose = 'qa'/);
  assert.match(reset, /raise exception 'The exact JFL two-captain QA matchup is required'/);
  assert.match(reset, /raise exception 'JFL two-captain QA reset did not reach its clean state'/);
  assert.match(reset, /^commit;/m);
  assert.doesNotMatch(reset, /\b(public|private|dru|gamma)\./i);
});

test('every reset mutation is restricted to the fixed team matchup', () => {
  const mutations = [...reset.matchAll(/^(?:delete from|update)\s+(jfl(?:_private)?\.[a-z_]+)[\s\S]*?(?=;)/gm)];
  assert.equal(mutations.length, 7);
  for (const [, table] of mutations) assert.match(table, /^jfl(?:_private)?\./);
  for (const [, statement] of mutations.map((match) => [match[1], match[0]])) {
    assert.ok(statement.includes(fixtureId), 'each mutation must be scoped to the fixed matchup');
  }
  assert.doesNotMatch(reset, /delete from jfl\.(?:rounds|seasons|teams|players|team_matches)\b/i);
});
