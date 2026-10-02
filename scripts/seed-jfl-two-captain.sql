-- #2802: complete the isolated JFL persona fixture for #2799 browser proof.
-- Run only against the shared non-production test database after
-- scripts/seed-test-personas.sql. No Gamma, DRU, or public-schema writes.
-- Existing score state is deliberately preserved on replay.

begin;

do $$
begin
  if to_regnamespace('jfl') is null or to_regnamespace('jfl_private') is null then
    raise exception 'JFL isolated schemas are required';
  end if;
  if not exists (
    select 1 from jfl.seasons
    where id = '18580000-1000-4000-8000-000000000000'
      and purpose = 'qa'
  ) then
    raise exception 'The JFL QA Persona Lab prerequisite is missing';
  end if;
end
$$;

-- Non-login auth placeholders; no usable identity or credentials are created.
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('18580000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'player-c@jfl.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'player-d@jfl.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now())
on conflict (id) do nothing;

insert into jfl.players (id, user_id, display_name)
values
  ('18580000-2000-4000-8000-000000000006', '18580000-0000-4000-8000-000000000006', 'TEST Player C'),
  ('18580000-2000-4000-8000-000000000007', '18580000-0000-4000-8000-000000000007', 'TEST Player D')
on conflict (id) do nothing;

insert into jfl.team_memberships (id, season_id, team_id, player_id, role)
values
  ('18580000-3000-4000-8000-000000000006', '18580000-1000-4000-8000-000000000000', '18580000-1100-4000-8000-000000000001', '18580000-2000-4000-8000-000000000006', 'player'),
  ('18580000-3000-4000-8000-000000000007', '18580000-1000-4000-8000-000000000000', '18580000-1100-4000-8000-000000000002', '18580000-2000-4000-8000-000000000007', 'player')
on conflict (id) do nothing;

-- The existing captains and Players A/B plus C/D make three rostered players
-- per side. A QA waiver satisfies the real lineup eligibility rule.
insert into jfl_private.payment_status (season_id, player_id, status)
select '18580000-1000-4000-8000-000000000000', player_id, 'waived'
from (values
  ('18580000-2000-4000-8000-000000000002'::uuid),
  ('18580000-2000-4000-8000-000000000003'::uuid),
  ('18580000-2000-4000-8000-000000000004'::uuid),
  ('18580000-2000-4000-8000-000000000005'::uuid),
  ('18580000-2000-4000-8000-000000000006'::uuid),
  ('18580000-2000-4000-8000-000000000007'::uuid)
) as fixture(player_id)
on conflict (season_id, player_id) do update
  set status = 'waived', updated_at = now();

insert into jfl.rounds (id, season_id, round_number, stage, scheduled_on, status)
values ('18580000-1200-4000-8000-000000000001', '18580000-1000-4000-8000-000000000000', 1, 'regular', current_date + 7, 'scheduled')
on conflict (id) do nothing;

insert into jfl.team_matches (id, season_id, round_id, table_number, team_a_id, team_b_id, status)
values (
  '18580000-1300-4000-8000-000000000001',
  '18580000-1000-4000-8000-000000000000',
  '18580000-1200-4000-8000-000000000001',
  1,
  '18580000-1100-4000-8000-000000000001',
  '18580000-1100-4000-8000-000000000002',
  'scheduled'
)
on conflict (id) do nothing;

-- Fail closed if a fixed fixture ID collides with different data.
do $$
begin
  if not exists (
    select 1 from jfl.team_matches
    where id = '18580000-1300-4000-8000-000000000001'
      and round_id = '18580000-1200-4000-8000-000000000001'
      and team_a_id = '18580000-1100-4000-8000-000000000001'
      and team_b_id = '18580000-1100-4000-8000-000000000002'
  ) then
    raise exception 'JFL two-captain matchup does not match its fixed identity';
  end if;
end
$$;

commit;
