import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createScorableMatchesHttpHandlers } from '../src/scorableMatchesHttp.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

const originalMigrationUrl = new URL(
  '../supabase/migrations/20260811020000_scorable_match_picker.sql',
  import.meta.url,
);
const explicitContextMigrationUrl = new URL(
  '../supabase/migrations/20260811120500_explicit_scoring_team_context.sql',
  import.meta.url,
);

test('scorable match RPC remains service-role only and now emits one explicit option per eligible team', async () => {
  const [originalSql, explicitSql] = await Promise.all([
    readFile(originalMigrationUrl, 'utf8'),
    readFile(explicitContextMigrationUrl, 'utf8'),
  ]);
  assert.match(originalSql, /list_scorable_player_matches/i);
  assert.match(originalSql, /grant execute on function public\.list_scorable_player_matches\(uuid\) to service_role/i);
  assert.match(explicitSql, /tm\.ends_at is null/i);
  assert.match(explicitSql, /tm\.team_id in\(pm\.team_a_id,pm\.team_b_id\)/i);
  assert.match(explicitSql, /pm\.status not in\('finalized','corrected'\)/i);
  assert.match(explicitSql, /scoring_team_id uuid/i);
  assert.match(explicitSql, /scoring_team_name text/i);
  assert.match(explicitSql, /grant execute on function public\.list_scorable_player_matches\(uuid\) to service_role/i);
  assert.doesNotMatch(explicitSql, /where e\.editable_side is not null/i);
});

test('HTTP handler authenticates and returns repository scoring options unchanged', async () => {
  let actorSeen = null;
  const handlers = createScorableMatchesHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      async listScorableMatches({ actorUserId }) {
        actorSeen = actorUserId;
        return [{
          player_match_id: 'match-1',
          scoring_team_id: 'team-a',
          scoring_team_name: 'Team A',
          editable_side: 'A',
        }];
      },
    }),
  });

  const response = await handlers.list(new Request('https://example.test/api/me/scorable-matches'), {});
  assert.equal(response.status, 200);
  assert.equal(actorSeen, 'user-1');
  assert.deepEqual(await response.json(), {
    matches: [{
      player_match_id: 'match-1',
      scoring_team_id: 'team-a',
      scoring_team_name: 'Team A',
      editable_side: 'A',
    }],
  });
});

test('score picker removes token and UUID entry while making scoring team explicit', () => {
  const html = renderScorePickerPage();
  assert.match(html, /Score a match/);
  assert.match(html, /No tokens or database IDs required/);
  assert.match(html, /If you belong to both teams/);
  assert.match(html, /\/api\/me\/scorable-matches/);
  assert.match(html, /\/scorecard\/live\?match=/);
  assert.match(html, /&team=/);
  assert.match(html, /scoring_team_id/);
  assert.match(html, /scoring_team_name/);
  assert.match(html, /Scoring for/);
  assert.doesNotMatch(html, /Access token<input/i);
  assert.doesNotMatch(html, /Match ID<input/i);
});
