import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const scoringSql = fs.readFileSync('supabase/migrations/20260811120500_explicit_scoring_team_context.sql', 'utf8');
const finalizationSql = fs.readFileSync('supabase/migrations/20260811121500_preserve_reconciled_score_validation.sql', 'utf8');
const editSql = fs.readFileSync('supabase/migrations/20260811233000_edit_player_match_score_rack.sql', 'utf8');

test('scoring mutations reject completed player matches', () => {
  assert.match(scoringSql, /record_player_match_score_rack[\s\S]*status in \('finalized', 'corrected'\)/i);
  assert.match(scoringSql, /undo_player_match_score_rack[\s\S]*status in \('finalized','corrected'\)/i);
  assert.match(scoringSql, /confirm_player_match_score[\s\S]*status in \('finalized','corrected'\)/i);
  assert.match(editSql, /update_player_match_score_rack[\s\S]*status in \('finalized', 'corrected'\)/i);
});

test('finalization requires confirmed matching ledgers', () => {
  assert.match(finalizationSql, /confirmed_at is null or submission_b\.confirmed_at is null[\s\S]*Both teams must confirm/i);
  assert.match(finalizationSql, /submission_a\.racks is distinct from submission_b\.racks[\s\S]*Team score histories must match/i);
  assert.match(finalizationSql, /status = 'finalized'[\s\S]*finalized_at = now\(\)/i);
});
