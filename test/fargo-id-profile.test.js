import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('profile wires fargo external id', () => {
  const page = readFileSync(new URL('../src/profilePage.js', import.meta.url), 'utf8');
  const repo = readFileSync(new URL('../src/playerProfileRepository.js', import.meta.url), 'utf8');
  const cmd = readFileSync(new URL('../src/playerProfileCommands.js', import.meta.url), 'utf8');
  const index = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(page, /data-fargo-id-input/);
  assert.match(page, /fargoExternalId/);
  assert.match(repo, /profile_fargo_external_id/);
  assert.match(cmd, /fargoExternalId/);
  assert.match(index, /fargo_external_id/);
});
