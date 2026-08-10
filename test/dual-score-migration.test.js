import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(
  'supabase/migrations/20260810130000_dual_score_confirmation.sql',
  'utf8',
);

test('dual score histories stay private and actor scoped', () => {
  assert.match(
    migration,
    /create table private\.player_match_score_submissions/i,
  );
  assert.match(
    migration,
    /unique \(player_match_id, tracker_player_id\)/i,
  );
  assert.match(
    migration,
    /revoke all on private\.player_match_score_submissions from public, anon, authenticated/i,
  );
  assert.match(
    migration,
    /private\.match_player_for_user\(actor_user_id, target_match\)/i,
  );
  assert.match(
    migration,
    /Only match players can submit independent score records/i,
  );
});

test('dual score migration exposes service-role-only rack, undo, confirm, and comparison RPCs', () => {
  for (const signature of [
    'record_player_match_score_rack\\(uuid, uuid, text\\)',
    'undo_player_match_score_rack\\(uuid, uuid\\)',
    'confirm_player_match_score\\(uuid, uuid\\)',
    'get_player_match_score_comparison\\(uuid, uuid\\)',
  ]) {
    assert.match(
      migration,
      new RegExp(`revoke all on function public\\.${signature} from public, anon, authenticated`, 'i'),
    );
    assert.match(
      migration,
      new RegExp(`grant execute on function public\\.${signature} to service_role`, 'i'),
    );
  }
});

test('score comparison detects missing, extra, or differing racks by first mismatch', () => {
  assert.match(
    migration,
    /greatest\(jsonb_array_length\(own_history\), jsonb_array_length\(opponent_history\)\)/i,
  );
  assert.match(
    migration,
    /\(own_history -> gs\) is distinct from \(opponent_history -> gs\)/i,
  );
  assert.match(
    migration,
    /own_history = opponent_history[\s\S]*own_submission\.confirmed_at is not null[\s\S]*opponent_submission\.confirmed_at is not null/i,
  );
});

test('editing a player score record clears its confirmation', () => {
  assert.match(
    migration,
    /do update set racks = excluded\.racks, confirmed_at = null/i,
  );
  assert.match(
    migration,
    /set racks = next_racks, confirmed_at = null/i,
  );
});
