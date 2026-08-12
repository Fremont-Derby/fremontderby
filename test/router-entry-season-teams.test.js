import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const entryPath = new URL('../src/routerEntry.js', import.meta.url);
const configPath = new URL('../wrangler.jsonc', import.meta.url);

test('worker entry composes new season-team routes without replacing the existing router', async () => {
  const [entry, config] = await Promise.all([
    readFile(entryPath, 'utf8'),
    readFile(configPath, 'utf8'),
  ]);
  assert.match(entry, /import legacyRouter from '\.\/router\.js'/);
  assert.match(entry, /routeAdminSeasonTeams/);
  assert.match(entry, /legacyRouter\.fetch/);
  assert.match(entry, /Manage season teams/);
  assert.equal(JSON.parse(config).main, 'src/routerEntry.js');
});
