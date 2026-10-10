import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { setAdminPlayerContactCommand } from '../src/playerContactCommands.js';

test('admin phone save requires an actor and a player', async () => {
  const repository = { setAdminPlayer() { return { has_phone: true }; } };
  assert.throws(
    () => setAdminPlayerContactCommand({ playerId: 'p1', phone: '2065550100' }, repository),
    /actorUserId is required/,
  );
  assert.throws(
    () => setAdminPlayerContactCommand({ actorUserId: 'a1', phone: '2065550100' }, repository),
    /playerId is required/,
  );
});

test('admin phone save normalizes and does not send the raw value shape', async () => {
  const calls = [];
  const repository = {
    setAdminPlayer(input) {
      calls.push(input);
      return { phone: input.phone, has_phone: true };
    },
  };
  const result = await setAdminPlayerContactCommand({
    actorUserId: 'admin',
    playerId: 'player-1',
    phone: ' 2065550100 ',
  }, repository);
  assert.deepEqual(calls, [{
    actorUserId: 'admin',
    playerId: 'player-1',
    phone: '2065550100',
  }]);
  assert.equal(result.has_phone, true);
});

test('DRU admin phone migration is lane-scoped and fail-closed', async () => {
  const sql = await readFile(new URL(
    '../supabase/migrations/20261010191200_dru_set_admin_player_phone.sql',
    import.meta.url,
  ), 'utf8');
  assert.match(sql, /function dru\.set_admin_player_phone/);
  assert.match(sql, /dru_private\.player_contacts/);
  assert.match(sql, /jsonb_build_object\('hasPhone', normalized_phone is not null\)/);
  const audit = sql.slice(sql.indexOf('insert into dru_private.audit_events'));
  assert.match(audit, /hasPhone/);
  assert.doesNotMatch(audit, /profile_phone/);
  assert.match(sql, /revoke all on function dru\.set_admin_player_phone\(uuid, uuid, text\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function dru\.set_admin_player_phone\(uuid, uuid, text\) to service_role/);
  assert.doesNotMatch(sql, /\b(public|jfl|gamma)\./);
});
