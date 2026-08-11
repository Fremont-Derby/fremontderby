import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260811114500_allow_multi_team_memberships.sql',
  import.meta.url,
);

const sql = await readFile(migrationUrl, 'utf8');

test('multi-team migration removes season-wide membership uniqueness', () => {
  assert.match(sql, /drop index if exists public\.one_active_team_membership_per_season/i);
  assert.match(sql, /create unique index one_active_team_membership_per_team[\s\S]*season_id, team_id, player_id[\s\S]*where ends_at is null/i);
});

test('captaincy remains limited to one active team per season', () => {
  assert.match(sql, /create unique index one_active_captaincy_per_season[\s\S]*season_id, player_id[\s\S]*role = 'captain'/i);
});

test('request and invitation checks are target-team scoped', () => {
  assert.match(sql, /Player is already an active member of this team/i);
  assert.doesNotMatch(sql, /Player already has an active team membership/i);

  const targetScopedChecks = sql.match(/tm\.season_id = [^\n]+[\s\S]{0,180}?tm\.team_id = [^\n]+[\s\S]{0,180}?tm\.player_id = [^\n]+[\s\S]{0,180}?tm\.ends_at is null/gi) ?? [];
  assert.ok(targetScopedChecks.length >= 4, 'expected target-team membership checks in join/invite paths');
});

test('crossed request and invite converge to one membership', () => {
  assert.match(sql, /pending_invitation_id/i);
  assert.match(sql, /pending_request_id/i);
  assert.match(sql, /update private\.team_invitations[\s\S]*status = 'accepted'/i);
  assert.match(sql, /update private\.team_membership_requests[\s\S]*status = 'approved'/i);
  assert.match(sql, /insert into public\.team_memberships\(season_id, team_id, player_id, role\)/i);
});

test('trusted join functions remain service-role only', () => {
  for (const signature of [
    'request_team_membership\\(uuid, uuid\\)',
    'respond_to_team_membership_request\\(uuid, uuid, text\\)',
    'invite_player_to_team\\(uuid, uuid, uuid\\)',
    'respond_to_team_invitation\\(uuid, uuid, text\\)',
  ]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${signature} from public, anon, authenticated`, 'i'));
    assert.match(sql, new RegExp(`grant execute on function public\\.${signature} to service_role`, 'i'));
  }
});
