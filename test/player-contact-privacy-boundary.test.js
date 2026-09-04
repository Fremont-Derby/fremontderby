import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const ordinaryReadModels = [
  'playerProfileRepository.js',
  'teamRepository.js',
  'chatRepository.js',
  'freeAgentRepository.js',
  'availabilityRepository.js',
  'dateAvailabilityRepository.js',
  'lineupRepository.js',
  'scorableMatchesRepository.js',
  'standingsRepository.js',
];

async function readSource(filename) {
  return readFile(new URL(`../src/${filename}`, import.meta.url), 'utf8');
}

test('ordinary player, team, message, availability, scoring, and standings reads cannot reach private phone data', async () => {
  for (const filename of ordinaryReadModels) {
    const source = await readSource(filename);
    assert.doesNotMatch(source, /private\.player_contacts/i, `${filename} must not query private contact storage`);
    assert.doesNotMatch(source, /get_(?:own|admin)_player_phone/i, `${filename} must not call full-phone RPCs`);
    assert.doesNotMatch(source, /(?:select|returns?)[^\n]{0,160}\bphone\b/i, `${filename} must not select or return phone values`);
  }
});

test('full phone values are confined to explicit self and single-player admin contact HTTP paths', async () => {
  const source = await readSource('playerContactHttp.js');
  assert.match(source, /\/api\/me\/contact/);
  assert.match(source, /admin/);
  assert.match(source, /players/);
  assert.match(source, /contact/);
  assert.match(source, /authenticateSupabaseUser/);
  assert.match(source, /getAdminPlayerContactCommand/);
  assert.match(source, /getOwnPlayerContactCommand/);
  assert.match(source, /jsonNoStore/);
  assert.match(source, /reveal/);
  assert.match(source, /maskPhone/);
});

test('contact migration exposes readiness broadly but full phone only through service-role self/admin detail RPCs', async () => {
  const sql = await readFile(
    new URL('../supabase/migrations/20260812080000_player_phone_contact.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /list_admin_player_contact_readiness/i);
  assert.match(sql, /has_phone/i);
  assert.match(sql, /get_own_player_phone/);
  assert.match(sql, /get_admin_player_phone/);
  assert.match(sql, /service_role/);
});
