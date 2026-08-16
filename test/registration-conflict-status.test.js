import test from 'node:test';
import assert from 'node:assert/strict';
import { rpcErrorStatus } from '../src/rpcErrorStatus.js';

test('statusForError maps registration uniqueness messages to 409', () => {
  assert.equal(
    rpcErrorStatus({ message: 'Player already has an active team membership' }),
    409,
  );
  assert.equal(
    rpcErrorStatus({ message: 'Supabase request failed with 400: already have a team application in this season' }),
    409,
  );
  assert.equal(
    rpcErrorStatus({ message: 'Season is not open for team applications' }),
    409,
  );
  assert.equal(
    rpcErrorStatus({ message: 'That team name is already used in this season' }),
    409,
  );
  assert.equal(
    rpcErrorStatus({
      message: 'Trade blocked: player still has an active team membership',
    }),
    409,
  );
});
