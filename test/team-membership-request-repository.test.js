import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('membership request repository requires Supabase URL and service role', () => {
  const src = readFileSync(new URL('../src/teamMembershipRequestRepository.js', import.meta.url), 'utf8');
  assert.match(src, /createTeamMembershipRequestRepository/);
});
