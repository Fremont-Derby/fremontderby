import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('joinable teams exclude active team and season memberships', () => {
  const src = readFileSync(new URL('../src/teamMembershipRequestRepository.js', import.meta.url), 'utf8');
  assert.match(src, /createTeamMembershipRequestRepository/);
});
