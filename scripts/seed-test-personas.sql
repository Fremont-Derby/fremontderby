-- #1858 JFL/Gamma-only deterministic validation personas.
-- Apply only to the shared fremontderby-test Supabase project.
-- The transaction fails closed unless all isolated JFL/Gamma schemas exist.

begin;

do $$
begin
  if to_regnamespace('jfl') is null
     or to_regnamespace('gamma') is null
     or to_regnamespace('jfl_private') is null
     or to_regnamespace('gamma_private') is null then
    raise exception 'Refusing to seed test personas: JFL/Gamma isolated schemas are required';
  end if;
end
$$;

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('18580000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin-no-team@jfl.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'admin-captain@jfl.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'regular-captain@jfl.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'player-a@jfl.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'player-b@jfl.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4001-8000-000000000001', 'authenticated', 'authenticated', 'admin-no-team@gamma.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4001-8000-000000000002', 'authenticated', 'authenticated', 'admin-captain@gamma.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4001-8000-000000000003', 'authenticated', 'authenticated', 'regular-captain@gamma.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4001-8000-000000000004', 'authenticated', 'authenticated', 'player-a@gamma.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now()),
  ('18580000-0000-4001-8000-000000000005', 'authenticated', 'authenticated', 'player-b@gamma.persona.invalid', '{"persona_fixture":true}'::jsonb, '{}'::jsonb, now(), now())
on conflict (id) do nothing;

insert into jfl.seasons (id, name, status, purpose, first_round_date)
values ('18580000-1000-4000-8000-000000000000', 'QA Persona Lab', 'active', 'qa', current_date)
on conflict (id) do update set name = excluded.name, status = 'active', purpose = 'qa', updated_at = now();

insert into gamma.seasons (id, name, status, purpose, first_round_date)
values ('18580000-1000-4001-8000-000000000000', 'QA Persona Lab', 'active', 'qa', current_date)
on conflict (id) do update set name = excluded.name, status = 'active', purpose = 'qa', updated_at = now();

insert into jfl.teams (id, season_id, name, created_by)
values
  ('18580000-1100-4000-8000-000000000001', '18580000-1000-4000-8000-000000000000', 'Persona Test Team A', '18580000-0000-4000-8000-000000000002'),
  ('18580000-1100-4000-8000-000000000002', '18580000-1000-4000-8000-000000000000', 'Persona Test Team B', '18580000-0000-4000-8000-000000000003')
on conflict (id) do update set season_id = excluded.season_id, name = excluded.name;

insert into gamma.teams (id, season_id, name, created_by)
values
  ('18580000-1100-4001-8000-000000000001', '18580000-1000-4001-8000-000000000000', 'Persona Test Team A', '18580000-0000-4001-8000-000000000002'),
  ('18580000-1100-4001-8000-000000000002', '18580000-1000-4001-8000-000000000000', 'Persona Test Team B', '18580000-0000-4001-8000-000000000003')
on conflict (id) do update set season_id = excluded.season_id, name = excluded.name;

insert into jfl.players (id, user_id, display_name)
values
  ('18580000-2000-4000-8000-000000000001', '18580000-0000-4000-8000-000000000001', 'TEST Admin — no team'),
  ('18580000-2000-4000-8000-000000000002', '18580000-0000-4000-8000-000000000002', 'TEST Admin Captain'),
  ('18580000-2000-4000-8000-000000000003', '18580000-0000-4000-8000-000000000003', 'TEST Regular Captain'),
  ('18580000-2000-4000-8000-000000000004', '18580000-0000-4000-8000-000000000004', 'TEST Player A'),
  ('18580000-2000-4000-8000-000000000005', '18580000-0000-4000-8000-000000000005', 'TEST Player B')
on conflict (id) do update set user_id = excluded.user_id, display_name = excluded.display_name, updated_at = now();

insert into gamma.players (id, user_id, display_name)
values
  ('18580000-2000-4001-8000-000000000001', '18580000-0000-4001-8000-000000000001', 'TEST Admin — no team'),
  ('18580000-2000-4001-8000-000000000002', '18580000-0000-4001-8000-000000000002', 'TEST Admin Captain'),
  ('18580000-2000-4001-8000-000000000003', '18580000-0000-4001-8000-000000000003', 'TEST Regular Captain'),
  ('18580000-2000-4001-8000-000000000004', '18580000-0000-4001-8000-000000000004', 'TEST Player A'),
  ('18580000-2000-4001-8000-000000000005', '18580000-0000-4001-8000-000000000005', 'TEST Player B')
on conflict (id) do update set user_id = excluded.user_id, display_name = excluded.display_name, updated_at = now();

insert into jfl_private.player_contacts (player_id, phone)
values
  ('18580000-2000-4000-8000-000000000002', '+12065550102'),
  ('18580000-2000-4000-8000-000000000003', '+12065550103')
on conflict (player_id) do update set phone = excluded.phone, updated_at = now();

insert into gamma_private.player_contacts (player_id, phone)
values
  ('18580000-2000-4001-8000-000000000002', '+12065551102'),
  ('18580000-2000-4001-8000-000000000003', '+12065551103')
on conflict (player_id) do update set phone = excluded.phone, updated_at = now();

insert into jfl.team_memberships (id, season_id, team_id, player_id, role)
values
  ('18580000-3000-4000-8000-000000000002', '18580000-1000-4000-8000-000000000000', '18580000-1100-4000-8000-000000000001', '18580000-2000-4000-8000-000000000002', 'captain'),
  ('18580000-3000-4000-8000-000000000003', '18580000-1000-4000-8000-000000000000', '18580000-1100-4000-8000-000000000002', '18580000-2000-4000-8000-000000000003', 'captain'),
  ('18580000-3000-4000-8000-000000000004', '18580000-1000-4000-8000-000000000000', '18580000-1100-4000-8000-000000000001', '18580000-2000-4000-8000-000000000004', 'player'),
  ('18580000-3000-4000-8000-000000000005', '18580000-1000-4000-8000-000000000000', '18580000-1100-4000-8000-000000000002', '18580000-2000-4000-8000-000000000005', 'player')
on conflict (id) do update set season_id = excluded.season_id, team_id = excluded.team_id, player_id = excluded.player_id, role = excluded.role, ends_at = null;

insert into gamma.team_memberships (id, season_id, team_id, player_id, role)
values
  ('18580000-3000-4001-8000-000000000002', '18580000-1000-4001-8000-000000000000', '18580000-1100-4001-8000-000000000001', '18580000-2000-4001-8000-000000000002', 'captain'),
  ('18580000-3000-4001-8000-000000000003', '18580000-1000-4001-8000-000000000000', '18580000-1100-4001-8000-000000000002', '18580000-2000-4001-8000-000000000003', 'captain'),
  ('18580000-3000-4001-8000-000000000004', '18580000-1000-4001-8000-000000000000', '18580000-1100-4001-8000-000000000001', '18580000-2000-4001-8000-000000000004', 'player'),
  ('18580000-3000-4001-8000-000000000005', '18580000-1000-4001-8000-000000000000', '18580000-1100-4001-8000-000000000002', '18580000-2000-4001-8000-000000000005', 'player')
on conflict (id) do update set season_id = excluded.season_id, team_id = excluded.team_id, player_id = excluded.player_id, role = excluded.role, ends_at = null;

insert into jfl_private.league_admins (user_id, granted_by, note)
values
  ('18580000-0000-4000-8000-000000000001', '18580000-0000-4000-8000-000000000002', '#1858 persona fixture: admin without team'),
  ('18580000-0000-4000-8000-000000000002', '18580000-0000-4000-8000-000000000002', '#1858 persona fixture: admin captain')
on conflict (user_id) do update set note = excluded.note;

insert into gamma_private.league_admins (user_id, granted_by, note)
values
  ('18580000-0000-4001-8000-000000000001', '18580000-0000-4001-8000-000000000002', '#1858 persona fixture: admin without team'),
  ('18580000-0000-4001-8000-000000000002', '18580000-0000-4001-8000-000000000002', '#1858 persona fixture: admin captain')
on conflict (user_id) do update set note = excluded.note;

commit;
