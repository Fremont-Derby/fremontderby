-- Emergency removal of the complete UNUSED #3645 principal fixture only.
-- Review current foreign keys and exact identities first; never cascade-delete
-- a played, rostered, messaged or otherwise used actor. Not an automatic step.
begin;
set local statement_timeout = '15s';
set local lock_timeout = '3s';
do $cleanup$
declare
  actors uuid[];
  players uuid[];
  dependency record;
  target_ids uuid[];
  referenced boolean;
begin
  if not pg_try_advisory_xact_lock(3645,1) then raise exception 'Actor fixture is occupied'; end if;
  select array_agg(('36430000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid),
         array_agg(('36430000-2000-4000-8000-' || lpad(i::text,12,'0'))::uuid)
    into actors,players from generate_series(1,8) i;
  perform 1 from auth.users u where u.id=any(actors) for update;
  perform 1 from jfl.players p where p.id=any(players) for update;
  if (select count(*) from auth.users u join generate_series(1,8) i
      on u.id=('36430000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid
      join jfl.players p on p.id=('36430000-2000-4000-8000-' || lpad(i::text,12,'0'))::uuid and p.user_id=u.id
      join jfl_private.player_contacts c on c.player_id=p.id
      join jfl.player_ratings r on r.player_id=p.id
      where u.email='full-season-captain-' || i || '@jfl.persona.invalid'
        and u.raw_app_meta_data='{"persona_fixture":true,"issue":3645}'::jsonb
        and u.banned_until='infinity'::timestamptz and coalesce(u.encrypted_password,'')=''
        and u.last_sign_in_at is null and p.display_name='TEST Full-season Captain ' || i
        and c.phone='+120655501' || (30+i)::text
        and r.fargo_rating=500 and r.rating_status='provisional') <> 8 then
    raise exception 'Exact complete unused actor fixture required for removal';
  end if;
  if exists(select 1 from pg_trigger where tgrelid in ('auth.users'::regclass,'jfl.players'::regclass)
      and not tgisinternal and (tgtype::integer & 8) <> 0) then
    raise exception 'Unexpected actor/player delete trigger requires review';
  end if;
  for dependency in
    select c.conrelid, c.confrelid, c.conkey, n.nspname, t.relname, a.attname
    from pg_constraint c join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    left join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
    where c.contype='f' and c.confrelid in ('auth.users'::regclass,'jfl.players'::regclass)
  loop
    if cardinality(dependency.conkey) <> 1 then raise exception 'Composite actor/player dependency requires review'; end if;
    -- These three owned relationships are the only bootstrap-created children.
    if dependency.confrelid='auth.users'::regclass and dependency.conrelid='jfl.players'::regclass
      and dependency.attname='user_id' then continue; end if;
    if dependency.confrelid='jfl.players'::regclass and dependency.attname='player_id'
      and dependency.conrelid in ('jfl.player_ratings'::regclass,'jfl_private.player_contacts'::regclass) then continue; end if;
    target_ids := case when dependency.confrelid='auth.users'::regclass then actors else players end;
    execute format('select exists(select 1 from %I.%I where %I=any($1))', dependency.nspname,dependency.relname,dependency.attname)
      into referenced using target_ids;
    if referenced then raise exception 'Used actor/player fixture has dependent history; removal refused'; end if;
  end loop;
  -- Reject even relationships not represented by current FK metadata.
  if exists(select 1 from jfl.season_players sp where sp.player_id=any(players))
    or exists(select 1 from jfl_private.league_admins a where a.user_id=any(actors)) then
    raise exception 'Used actor/player fixture has season or admin state; removal refused';
  end if;
  delete from jfl_private.player_contacts c where c.player_id=any(players);
  delete from jfl.player_ratings r where r.player_id=any(players);
  delete from jfl.players p where p.id=any(players) and p.user_id=any(actors);
  delete from auth.users u where u.id=any(actors);
end
$cleanup$;
commit;
