import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../scripts/seed-jfl-two-captain.sql', import.meta.url), 'utf8');

test('JFL two-captain seed publishes one shared regular matchup and eligible rosters', () => {
  assert.match(sql, /to_regnamespace\('jfl'\)/);
  assert.match(sql, /purpose = 'qa'/);
  assert.match(sql, /insert into jfl\.rounds/i);
  assert.match(sql, /insert into jfl\.team_matches/i);
  assert.match(sql, /insert into jfl_private\.payment_status/i);
  assert.match(sql, /on conflict \(id\) do nothing/gi);
  assert.doesNotMatch(sql, /insert into (?:gamma|dru|public)\./i);
  assert.doesNotMatch(sql, /delete from|truncate table|drop table/i);
});
