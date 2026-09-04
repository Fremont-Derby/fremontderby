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
  assert.match(source, /url\.pathname === '\/api\/me\/contact'/);
  assert.match(source, /\^\\\/api\\\/admin\\\/players\\\/\(\[^\/\]\+\)\\\/contact\$/);
  assert.match(source, /authenticateSupabaseUser/);
  assert.match(source, /getAdminPlayerContactCommand/);
  assert.match(source, /getOwnPlayerContactCommand/);
  assert.match(source, /jsonNoStore|no-store|Cache-Control/i);
  assert.match(source, /reveal/);
  assert.match(source, /maskPhone|phoneMasked/);
  assert.doesNotMatch(source, /\/api\/(?:players|teams|messages|standings)\//);
});

test('contact migration exposes readiness broadly but full phone only through service-role self/admin detail RPCs', async () => {
  const sql = await readFile(
    new URL('../supabase/migrations/20260812080000_player_phone_contact.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /list_admin_player_contact_readiness[\s\S]*returns table\([\s\S]*player_id uuid,[\s\S]*has_phone boolean[\s\S]*\)/i);
  assert.doesNotMatch(
    sql.match(/create or replace function public\.list_admin_player_contact_readiness[\s\S]*?\$\$;/i)?.[0] ?? '',
    /\bphone text\b/i,
  );
  for (const signature of [
    'get_own_player_phone\\(uuid\\)',
    'set_own_player_phone\\(uuid, text\\)',
    'get_admin_player_phone\\(uuid, uuid\\)',
  ]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${signature} from public, anon, authenticated`, 'i'));
    assert.match(sql, new RegExp(`grant execute on function public\\.${signature} to service_role`, 'i'));
  }
  assert.match(sql, /audit history records readiness only, never the phone value/i);
});
