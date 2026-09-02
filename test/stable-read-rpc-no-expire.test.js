import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort();

const lastByName = new Map();
const startRe = /create(?:\s+or\s+replace)?\s+function\s+((?:[A-Za-z_][\w]*|__LANE__)\.list_(?:public_season_registration|all_season_registration_internal))\s*\(/gi;

for (const name of files) {
  const sql = readFileSync(new URL(name, migrationsDir), 'utf8');
  let match;
  startRe.lastIndex = 0;
  const starts = [];
  while ((match = startRe.exec(sql))) {
    starts.push({ key: match[1].toLowerCase(), index: match.index });
  }
  for (const start of starts) {
    lastByName.set(start.key, sql.slice(start.index, start.index + 3200));
  }
}

test('final public and lane season-registration reads do not expire', () => {
  const required = [
    'public.list_all_season_registration_internal',
    'public.list_public_season_registration',
    'gamma.list_all_season_registration_internal',
    'gamma.list_public_season_registration',
    'jfl.list_all_season_registration_internal',
    'jfl.list_public_season_registration',
    'dru.list_all_season_registration_internal',
    'dru.list_public_season_registration',
  ];
  for (const key of required) {
    const body = lastByName.get(key);
    assert.ok(body, `missing final definition for ${key}`);
    assert.doesNotMatch(
      body,
      /expire_season_team_registration/i,
      `${key} still calls expire-on-read`,
    );
    assert.match(body, /language sql/i, `${key} should be SQL`);
    assert.match(body, /\bstable\b/i, `${key} should be STABLE`);
  }
});
