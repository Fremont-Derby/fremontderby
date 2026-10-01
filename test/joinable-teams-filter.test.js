import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'src/teamMembershipRequestRepository.js'),
  'utf8',
);

test('joinable teams exclude active team and season memberships', () => {
  assert.match(src, /activeTeamIds/);
  assert.match(src, /!activeTeamIds\.has\(team\.team_id\)/);
  assert.match(src, /!activeSeasonIds\.has\(team\.season_id\)/);
});
