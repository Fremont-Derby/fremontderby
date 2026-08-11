import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/20260811033500_team_membership_requests.sql',
  'utf8',
);

test('join requests are private and protected by RLS', () => {
  assert.match(sql, /create table private\.team_membership_requests/i);
  assert.match(sql, /alter table private\.team_membership_requests enable row level security/i);
  assert.match(sql, /revoke all on private\.team_membership_requests from anon, authenticated/i);
});

test('only one pending request exists per player/team/season', () => {
  assert.match(sql, /create unique index one_pending_membership_request_per_team[\s\S]*where status = 'pending'/i);
});

test('membership requests support request, captain response, cancellation, and read model RPCs', () => {
  for (const fn of [
    'request_team_membership',
    'respond_to_team_membership_request',
    'cancel_team_membership_request',
    'get_own_team_membership_requests',
  ]) {
    assert.match(sql, new RegExp(`function public\\.${fn}`, 'i'));
  }
});

test('captain approval checks active captaincy and blocks duplicate active membership', () => {
  assert.match(sql, /role = 'captain'[\s\S]*ends_at is null/i);
  assert.match(sql, /Player already has an active team membership/i);
  assert.match(sql, /Only the active captain can respond to membership requests/i);
});

test('browser roles cannot call trusted membership-request RPCs directly', () => {
  assert.match(sql, /revoke all on function public\.request_team_membership\(uuid, uuid\) from public/i);
  assert.match(sql, /grant execute on function public\.request_team_membership\(uuid, uuid\) to service_role/i);
  assert.doesNotMatch(sql, /grant execute[\s\S]*to authenticated/i);
});
