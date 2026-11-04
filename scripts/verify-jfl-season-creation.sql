-- #3318: rollback-only JFL creation/auth/preservation proof; no private output.
begin;
set local role service_role;
do $proof$
declare
  admin_id uuid := '18580000-0000-4000-8000-000000000002';
  player_id uuid := '18580000-0000-4000-8000-000000000004';
  created_id uuid;
  another_id uuid;
  baseline jsonb;
  baseline_count integer;
  denied boolean;
begin
  if not exists(select 1 from jfl_private.league_admins where user_id=admin_id) or exists(select 1 from jfl_private.league_admins where user_id=player_id) then raise exception 'Synthetic persona qualification failed'; end if;
  select jsonb_object_agg(s.id,to_jsonb(s)),count(*) into baseline,baseline_count from jfl.seasons s;
  select id into created_id from jfl.create_season_setup(admin_id,'JFL QA #3318 rollback','Thursday','2026-11-05',5,3,5,7,array[1,2,3,4],'season-1-default',4,true,'qa');
  select id into another_id from jfl.create_season_setup(admin_id,'JFL QA #3318 second','Thursday','2026-11-05',5,3,5,7,array[1,2,3,4],'season-1-default',4,true,'qa');
  if created_id=another_id or baseline ? created_id::text or baseline ? another_id::text then raise exception 'Distinct identity failed'; end if;
  if exists(select 1 from jfl.seasons s where baseline ? s.id::text and baseline->s.id::text <> to_jsonb(s)) then raise exception 'Prior season mutated'; end if;
  if exists(select 1 from jfl.rounds where season_id in (created_id,another_id)) then raise exception 'Creation published rounds'; end if;
  if exists(select 1 from jfl.seasons where id in (created_id,another_id) and (status<>'registration' or purpose<>'qa')) then raise exception 'Creation lifecycle or QA isolation failed'; end if;
  denied:=false;
  begin perform jfl.create_season_setup(player_id,'Denied','Thursday','2026-11-05',5,3,5,7,array[1,2,3,4],'season-1-default',4,true,'qa'); exception when others then if sqlerrm<>'Actor is not a league admin' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Player creation authorized'; end if;
  denied:=false;
  begin perform jfl.create_season_setup(admin_id,'Invalid','Thursday','2026-11-05',5,3,5,7,array[1,1,3,4],'season-1-default',4,true,'qa'); exception when others then if sqlerrm not like '%four unique positive integers%' then raise; end if; denied:=true; end;
  if not denied or (select count(*) from jfl.seasons)<>baseline_count+2 then raise exception 'Invalid create left a row'; end if;
  if has_function_privilege('anon','jfl.create_season_setup(uuid,text,text,date,integer,integer,integer,integer,integer[],text,integer,boolean,text)','execute') or has_function_privilege('authenticated','jfl.create_season_setup(uuid,text,text,date,integer,integer,integer,integer,integer[],text,integer,boolean,text)','execute') then raise exception 'Browser RPC privilege leak'; end if;
end;
$proof$;
select 'PASS distinct creation, prior preservation, no publish, QA isolation, player denial, invalid rollback, browser RPC revokes' proof;
rollback;
