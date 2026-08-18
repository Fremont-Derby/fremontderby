import assert from 'node:assert/strict';
import test from 'node:test';
import { createChatRepository } from '../src/chatRepository.js';
import { createLineupRepository } from '../src/lineupRepository.js';
import { createStandingsRepository } from '../src/standingsRepository.js';
import { createPlayoffRepository } from '../src/playoffRepository.js';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';

function assertRepoEnv(factory, name) {
  test(`${name} requires Supabase URL, service role, and fetch`, () => {
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

assertRepoEnv(createChatRepository, 'chat repository');
assertRepoEnv(createLineupRepository, 'lineup repository');
assertRepoEnv(createStandingsRepository, 'standings repository');
assertRepoEnv(createPlayoffRepository, 'playoff repository');
assertRepoEnv(createDualScoringRepository, 'dual scoring repository');
