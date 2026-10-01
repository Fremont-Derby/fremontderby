import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('season-setup is classified under admin section', () => {
  const src = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  assert.match(src, /pathname === '\/season-setup'.*return 'admin'/s);
});

test('moderation and profile register live refresh', () => {
  const mod = readFileSync(new URL('../src/chatModerationPage.js', import.meta.url), 'utf8');
  const profile = readFileSync(new URL('../src/profilePage.js', import.meta.url), 'utf8');
  assert.match(mod, /fdLiveRefresh/);
  assert.match(profile, /fdLiveRefresh/);
});

test('ready check shell banner and teams hub exist', () => {
  const shell = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  const teams = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(shell, /data-ready-check/);
  assert.match(shell, /\/api\/me\/ready-checks/);
  assert.match(teams, /\/api\/teams\/ready-checks/);
});
