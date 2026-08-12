import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import routerEntry from '../src/routerEntry.js';

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

test('shared product shell uses the canonical Test Drive the App label', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/demo'), {}, {});
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<title>Test Drive the App · Fremont Derby<\/title>/);
  assert.match(html, /<h1>Test Drive the App<\/h1>/);
  assert.match(html, />Test Drive the App<\/a>/);
  assert.doesNotMatch(html, />Demo<\/a>/);
});

test('directly decorated admin season-team route inherits the canonical shared-shell label', async () => {
  const response = await routerEntry.fetch(
    new Request('https://example.test/admin/season-teams'),
    {},
    {},
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, />Test Drive the App<\/a>/);
  assert.doesNotMatch(html, />Demo<\/a>/);
});

test('authorized Profile admin grouping exposes season-team management within two actions', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/profile'), {}, {});
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<nav class="admin-actions" aria-label="League admin tools">/);
  assert.match(html, /href="\/admin\/season-teams">Season teams<\/a>/);
  assert.match(html, /href="\/season-setup">Season setup<\/a>/);
});
