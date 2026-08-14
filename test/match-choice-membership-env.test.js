import assert from 'node:assert/strict';
import test from 'node:test';
import { createTeamMatchChoiceRepository } from '../src/teamMatchChoiceRepository.js';
import { createTeamMembershipRequestRepository } from '../src/teamMembershipRequestRepository.js';
import { createSeasonRegistrationRepository } from '../src/seasonRegistrationRepository.js';
import { createSupabaseSeasonRepository } from '../src/supabaseSeasonRepository.js';

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

lock(createTeamMatchChoiceRepository, 'team match choice repository');
lock(createTeamMembershipRequestRepository, 'team membership request repository');
lock(createSeasonRegistrationRepository, 'season registration repository');
lock(createSupabaseSeasonRepository, 'supabase season repository');
