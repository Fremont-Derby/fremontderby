import assert from 'node:assert/strict';
import test from 'node:test';
import { createPrizeRepository } from '../src/prizeRepository.js';
import { createScoringRepository } from '../src/scoringRepository.js';
import { createPlayerContactRepository } from '../src/playerContactRepository.js';
import { createPlayerProfileRepository } from '../src/playerProfileRepository.js';
import { createAdminPlayersRepository } from '../src/adminPlayersRepository.js';
import { createAdminSeasonTeamsRepository } from '../src/adminSeasonTeamsRepository.js';

function lock(factory, label) {
  test(`${label} requires Supabase URL, service role, and fetch`, () => {
    assert.throws(() => factory({ SUPABASE_SERVICE_ROLE_KEY: 'x' }), /SUPABASE_URL/);
    assert.throws(() => factory({ SUPABASE_URL: 'https://example.supabase.co' }), /SUPABASE_SERVICE_ROLE_KEY/);
    assert.throws(
      () => factory(
        { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'secret' },
        { fetch: null },
      ),
      /fetch implementation is required/,
    );
  });
}

lock(createPrizeRepository, 'prize repository');
lock(createScoringRepository, 'scoring repository');
lock(createPlayerContactRepository, 'player contact repository');
lock(createPlayerProfileRepository, 'player profile repository');
lock(createAdminPlayersRepository, 'admin players repository');
lock(createAdminSeasonTeamsRepository, 'admin season teams repository');
