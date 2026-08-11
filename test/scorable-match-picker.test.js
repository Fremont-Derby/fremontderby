import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createScorableMatchesHttpHandlers } from '../src/scorableMatchesHttp.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

const migrationUrl = new URL(
  '../supabase/migrations/20260811020000_scorable_match_picker.sql',
  import.meta.url,
);

test('scorable match RPC is service-role only and team scoped', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /list_scorable_player_matches/i);
  assert.match(sql, /tm\.ends_at is null/i);
  assert.match(sql, /tm\.team_id in \(pm\.team_a_id, pm\.team_b_id\)/i);
  assert.match(sql, /pm\.status not in \('finalized', 'corrected'\)/i);
  assert.match(sql, /grant execute on function public\.list_scorable_player_matches\(uuid\) to service_role/i);
  assert.match(sql, /where e\.editable_side is not null/i);
});

test('HTTP handler authenticates and returns only repository matches', async () => {
  let actorSeen = null;
  const handlers = createScorableMatchesHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      async listScorableMatches({ actorUserId }) {
        actorSeen = actorUserId;
        return [{ player_match_id: 'match-1', editable_side: 'A' }];
      },
    }),
  });

  const response = await handlers.list(new Request('https://example.test/api/me/scorable-matches'), {});
  assert.equal(response.status, 200);
  assert.equal(actorSeen, 'user-1');
  assert.deepEqual(await response.json(), {
    matches: [{ player_match_id: 'match-1', editable_side: 'A' }],
  });
});

test('score picker removes token and UUID entry from the normal scoring start surface', () => {
  const html = renderScorePickerPage();
  assert.match(html, /Score a match/);
  assert.match(html, /No tokens or database IDs required/);
  assert.match(html, /\/api\/me\/scorable-matches/);
  assert.match(html, /\/scorecard\/live\?match=/);
  assert.doesNotMatch(html, /Access token<input/i);
  assert.doesNotMatch(html, /Match ID<input/i);
});
