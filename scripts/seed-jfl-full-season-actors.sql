-- #3645: dedicated non-login principals only. No season/team/score repair.
-- Called only by the exact-SHA trusted JFL reset job, before its fixture reset.
begin;
set local statement_timeout = '15s';
set local lock_timeout = '3s';

do $fixture$
declare
  actor_id uuid;
  fixture_player_id uuid;
  actor_email text;
  player_name text;
  contact_phone text;
  item integer;
  lane text;
  collision boolean;
  existing_count integer;
  fixture_players uuid[];
  original_history jsonb := '{}'::jsonb;
  history_table record;
  original_hash text;
  predicate text;
begin
  if to_regnamespace('jfl') is null or to_regnamespace('jfl_private') is null then
    raise exception 'JFL isolated schemas are required';
  end if;
  if not pg_try_advisory_xact_lock(3645, 1) then
    raise exception 'Full-season actor bootstrap is already occupied';
  end if;
  if not exists (select 1 from jfl.seasons where
    id = '18580000-1000-4000-8000-000000000000' and purpose = 'qa') then
    raise exception 'Fixed JFL QA prerequisite is missing';
  end if;

  select count(*) into existing_count from auth.users u join generate_series(1,8) i
    on u.id = ('36430000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid;
  if existing_count not in (0,8) then
    raise exception 'Partial full-season principal set requires investigation';
  end if;

  -- Freeze JFL season registration state through this brief transaction. The
  -- existing trigger auto-registers new players when exactly one season is open.
  -- Never disable triggers or insert fixture players into an unrelated season.
  if existing_count = 0 then
  lock table jfl.seasons in share mode;
  if (select count(*) from jfl.seasons where status = 'registration') = 1 then
    raise exception 'Player auto-registration would mutate an existing season';
  end if;
  if (select count(*) from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal) <> 0
    or exists(select 1 from pg_trigger where tgrelid in ('jfl.player_ratings'::regclass,'jfl_private.player_contacts'::regclass) and not tgisinternal)
    or (select count(*) from pg_trigger where tgrelid = 'jfl.players'::regclass and not tgisinternal) <> 2
    or not exists (select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid join pg_namespace n on n.oid = p.pronamespace
      where t.tgrelid='jfl.players'::regclass and t.tgtype=5 and t.tgname='players_auto_register_for_open_season'
        and n.nspname = 'jfl_private' and p.proname = 'auto_register_new_player_for_open_season'
        and md5(p.prosrc) = '3f672d77e573697b896dca087c090557')
    or not exists (select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid join pg_namespace n on n.oid = p.pronamespace
      where t.tgrelid='jfl.players'::regclass and t.tgtype=5 and t.tgname='seed_provisional_player_rating_after_insert'
        and n.nspname = 'jfl_private' and p.proname = 'seed_provisional_player_rating'
        and md5(p.prosrc) = '27b7e8ce05fbfbbfad5eb2b4bcf90190') then
    raise exception 'Player/auth trigger behavior changed; requalify bootstrap';
  end if;
  end if;

  for item in 1..8 loop
    actor_id := ('36430000-0000-4000-8000-' || lpad(item::text, 12, '0'))::uuid;
    fixture_player_id := ('36430000-2000-4000-8000-' || lpad(item::text, 12, '0'))::uuid;
    actor_email := 'full-season-captain-' || item || '@jfl.persona.invalid';
    player_name := 'TEST Full-season Captain ' || item;
    contact_phone := '+120655501' || (30 + item)::text;
    if exists (select 1 from auth.users u where
      (lower(u.email) = actor_email and u.id <> actor_id) or
      (u.id = actor_id and (u.email is distinct from actor_email
        or u.aud is distinct from 'authenticated' or u.role is distinct from 'authenticated'
        or coalesce(u.encrypted_password, '') <> '' or coalesce(u.phone, '') <> ''
        or u.email_confirmed_at is not null or u.phone_confirmed_at is not null
        or u.last_sign_in_at is not null or u.deleted_at is not null
        or u.banned_until is distinct from 'infinity'::timestamptz
        or u.raw_app_meta_data is distinct from '{"persona_fixture":true,"issue":3645}'::jsonb
        or coalesce(u.raw_user_meta_data, '{}'::jsonb) <> '{}'::jsonb)))
      or exists (select 1 from auth.identities where user_id = actor_id)
      or exists (select 1 from auth.sessions where user_id = actor_id) then
      raise exception 'Full-season non-login auth identity collision';
    end if;
    if existing_count = 8 and not exists (select 1 from jfl.players p
      join jfl_private.player_contacts c on c.player_id=p.id
      where p.id=fixture_player_id and p.user_id=actor_id and c.phone=contact_phone) then
      raise exception 'Incomplete existing full-season player/contact fixture';
    end if;
    if exists(select 1 from jfl_private.league_admins a where a.user_id=actor_id) then
      raise exception 'Full-season captain must not have league-admin privileges';
    end if;
    if exists (select 1 from jfl.players p where
      (p.id = fixture_player_id and (p.user_id is distinct from actor_id or p.display_name is distinct from player_name))
      or (p.user_id = actor_id and p.id <> fixture_player_id))
      or exists (select 1 from jfl_private.player_contacts c
        where c.player_id = fixture_player_id and c.phone is distinct from contact_phone) then
      raise exception 'Full-season player/contact identity collision';
    end if;
    foreach lane in array array['gamma', 'dru', 'public'] loop
      if exists (select 1 from information_schema.columns
        where table_schema = lane and table_name = 'players' and column_name = 'user_id') then
        execute format('select exists(select 1 from %I.players where user_id = $1)', lane)
          into collision using actor_id;
        if collision then raise exception 'Full-season actor is linked outside JFL'; end if;
      end if;
    end loop;
  end loop;

  -- Once qualified, preserve memberships/eligibility and all fixture history.
  -- Never fill in partially missing principals or rerun player insert triggers.
  if existing_count = 8 then return; end if;

  select array_agg(('36430000-2000-4000-8000-' || lpad(i::text,12,'0'))::uuid)
    into fixture_players from generate_series(1,8) i;
  -- Capture immediately before bootstrap, not before the preceding browser run
  -- or after the next intentional reset. Exclude only the eight new players'
  -- global identity/contact/rating rows; all prior rows must remain identical.
  for history_table in select * from (values
    ('jfl','seasons',null),('jfl','teams',null),('jfl','team_memberships',null),
    ('jfl','season_players',null),('jfl','rounds',null),('jfl','team_matches',null),
    ('jfl','players','id'),('jfl_private','player_contacts','player_id'),
    ('jfl','player_ratings','player_id'),('jfl_private','team_applications',null),
    ('jfl_private','season_team_slots',null),('jfl','user_notifications',null),
    ('jfl_private','audit_events',null),('jfl_private','audit_webhook_outbox',null),
    ('jfl','direct_message_consent',null),('jfl','social_chat_consent',null),
    ('jfl_private','payment_status',null)
  ) as config(schema_name,table_name,excluded_player_column) loop
    predicate := case when history_table.excluded_player_column is null then ''
      else format('where not (s.%I=any($1))',history_table.excluded_player_column) end;
    execute format('select md5(coalesce(string_agg(to_jsonb(s)::text,''|'' order by to_jsonb(s)::text),'''')) from %I.%I s %s',
      history_table.schema_name,history_table.table_name,predicate) into original_hash using fixture_players;
    original_history := original_history || jsonb_build_object(history_table.schema_name || '.' || history_table.table_name,original_hash);
  end loop;

  -- No UPDATE or upsert replacement is allowed. A concurrent collision causes
  -- verification failure and rolls the entire eight-actor transaction back.
  for item in 1..8 loop
    actor_id := ('36430000-0000-4000-8000-' || lpad(item::text, 12, '0'))::uuid;
    fixture_player_id := ('36430000-2000-4000-8000-' || lpad(item::text, 12, '0'))::uuid;
    actor_email := 'full-season-captain-' || item || '@jfl.persona.invalid';
    player_name := 'TEST Full-season Captain ' || item;
    contact_phone := '+120655501' || (30 + item)::text;
    insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, banned_until, created_at, updated_at)
      values (actor_id, 'authenticated', 'authenticated', actor_email,
        '{"persona_fixture":true,"issue":3645}', '{}', 'infinity', now(), now())
      on conflict (id) do nothing;
    insert into jfl.players (id, user_id, display_name)
      values (fixture_player_id, actor_id, player_name) on conflict (id) do nothing;
    insert into jfl_private.player_contacts (player_id, phone)
      values (fixture_player_id, contact_phone) on conflict do nothing;
    if not exists (select 1 from auth.users u join jfl.players p on p.user_id = u.id
      join jfl_private.player_contacts c on c.player_id = p.id
      where u.id = actor_id and u.email = actor_email and u.banned_until = 'infinity'::timestamptz
        and u.raw_app_meta_data = '{"persona_fixture":true,"issue":3645}'::jsonb
        and coalesce(u.encrypted_password, '') = '' and p.id = fixture_player_id
        and p.display_name = player_name and c.phone = contact_phone)
      or exists (select 1 from jfl.season_players sp where sp.player_id = ('36430000-2000-4000-8000-' || lpad(item::text, 12, '0'))::uuid)
      or exists (select 1 from auth.identities where user_id = actor_id)
      or exists (select 1 from auth.sessions where user_id = actor_id) then
      raise exception 'Full-season actor bootstrap verification failed';
    end if;
  end loop;
  for history_table in select * from (values
    ('jfl','seasons',null),('jfl','teams',null),('jfl','team_memberships',null),
    ('jfl','season_players',null),('jfl','rounds',null),('jfl','team_matches',null),
    ('jfl','players','id'),('jfl_private','player_contacts','player_id'),
    ('jfl','player_ratings','player_id'),('jfl_private','team_applications',null),
    ('jfl_private','season_team_slots',null),('jfl','user_notifications',null),
    ('jfl_private','audit_events',null),('jfl_private','audit_webhook_outbox',null),
    ('jfl','direct_message_consent',null),('jfl','social_chat_consent',null),
    ('jfl_private','payment_status',null)
  ) as config(schema_name,table_name,excluded_player_column) loop
    predicate := case when history_table.excluded_player_column is null then ''
      else format('where not (s.%I=any($1))',history_table.excluded_player_column) end;
    execute format('select md5(coalesce(string_agg(to_jsonb(s)::text,''|'' order by to_jsonb(s)::text),'''')) from %I.%I s %s',
      history_table.schema_name,history_table.table_name,predicate) into original_hash using fixture_players;
    if original_hash is distinct from original_history->>(history_table.schema_name || '.' || history_table.table_name) then
      raise exception 'Original JFL history changed during bootstrap; entire transaction rolled back';
    end if;
  end loop;
end
$fixture$;
commit;
