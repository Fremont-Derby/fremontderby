import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repo = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/teamRepository.js'), 'utf8');
const page = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/teamsPage.js'), 'utf8');

test('team management loads applications for open seasons', () => {
  assert.match(repo, /get_own_team_registration/);
  assert.match(repo, /applications/);
  assert.match(page, /function renderApplications/);
  assert.match(page, /data\.applications/);
});
