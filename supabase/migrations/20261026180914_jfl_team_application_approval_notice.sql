-- #3637 / #3614. Apply only to the independently verified JFL project
-- oqkkvqkerusepyokzbmt, after exclusive fixture proof/cleanup. This migration
-- creates no product/test rows and never changes notification read grants.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $guard$
begin
  if current_user <> 'postgres' then
    raise exception 'Approval Notice migration requires the qualified owner';
  end if;
  if not exists (select 1 from pg_class where oid='jfl.user_notifications'::regclass and relrowsecurity)
    or exists (select 1 from pg_policy where polrelid='jfl.user_notifications'::regclass)
    or has_table_privilege('anon','jfl.user_notifications','select,insert,update,delete')
    or has_table_privilege('authenticated','jfl.user_notifications','select,insert,update,delete')
  then raise exception 'JFL notification read boundary changed'; end if;

  if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    join (values
      ('admin_review_team_application',4,'7c5596bec3ff5f9c45e14de5c1d2bb0a'),
      ('list_my_notifications',2,'0d087a96d4198c78f5d8bbcde511425c')
    ) expected(name,argument_count,source_hash)
      on expected.name=p.proname and expected.argument_count=p.pronargs
    where n.nspname='jfl' and md5(p.prosrc)=expected.source_hash
      and p.prosecdef and pg_get_userbyid(p.proowner)='postgres'
      and p.proconfig=array['search_path=""']::text[]
      and not has_function_privilege('anon',p.oid,'execute')
      and not has_function_privilege('authenticated',p.oid,'execute')
      and has_function_privilege('service_role',p.oid,'execute')) <> 2
  then raise exception 'JFL approval or Notice RPC baseline changed'; end if;

  if to_regprocedure('jfl_private.notify_approved_team_application()') is not null
    or to_regclass('jfl.user_notifications_application_approval_once') is not null
    or exists (select 1 from pg_trigger where tgrelid='jfl_private.team_applications'::regclass
      and tgname='team_application_approval_notice')
    or exists (select 1 from jfl.user_notifications where kind='team_application_approved')
  then raise exception 'Approval Notice objects/data already exist; inspect rather than replace'; end if;
end;
$guard$;

-- Only this operational event participates in the dedupe key. Existing Notice
-- kinds/payloads/read timestamps and the public RPC DTO remain unchanged.
create unique index user_notifications_application_approval_once
  on jfl.user_notifications (recipient_user_id, (payload->>'teamApplicationId'))
  where kind='team_application_approved';

create function jfl_private.notify_approved_team_application()
returns trigger
language plpgsql
-- The existing qualified approval function supplies its owner authority.
-- This trigger adds no independent SECURITY DEFINER entrypoint.
security invoker
set search_path = ''
as $notice$
declare
  recipient uuid;
  approved_team text;
  approved_season text;
begin
  if tg_op <> 'UPDATE' or old.status not in ('applied','deferred')
    or new.status <> 'approved_pending_roster'
  then return new; end if;

  if new.reviewed_by_user_id is null or not exists (
    select 1 from jfl_private.league_admins where user_id=new.reviewed_by_user_id
  ) then raise exception 'Approval Notice requires a qualified Admin reviewer'; end if;

  select p.user_id,t.name,s.name into recipient,approved_team,approved_season
  from jfl.players p
  join jfl.teams t on t.id=new.team_id and t.season_id=new.season_id
  join jfl.seasons s on s.id=new.season_id
  join jfl.team_memberships m on m.season_id=s.id and m.team_id=t.id
    and m.player_id=p.id and m.role='captain' and m.ends_at is null
  join jfl_private.season_team_slots slot on slot.id=new.slot_id
    and slot.season_id=s.id and slot.team_id=t.id and slot.assigned_captain_player_id=p.id
  where p.id=new.applicant_player_id;
  if not found then raise exception 'Approved application team/captain/season identity is incomplete'; end if;
  -- Unlinked historical/test records have no inbox recipient. Never substitute
  -- the reviewer, a team audience, an email address or an arbitrary user.
  if recipient is null then return new; end if;

  insert into jfl.user_notifications (
    recipient_user_id,kind,title,body,href,team_id,season_id,created_by,payload
  ) values (
    recipient,'team_application_approved','Team application approved',
    format('%s in %s is approved. View your teams to finish preparing your roster.',approved_team,approved_season),
    '/teams?view=mine',new.team_id,new.season_id,new.reviewed_by_user_id,
    jsonb_build_object('teamApplicationId',new.id::text)
  ) on conflict (recipient_user_id, (payload->>'teamApplicationId'))
    where kind='team_application_approved'
    do nothing;
  return new;
end;
$notice$;

revoke all on function jfl_private.notify_approved_team_application() from public,anon,authenticated;

create trigger team_application_approval_notice
after update of status on jfl_private.team_applications
for each row
when (old.status in ('applied','deferred') and new.status='approved_pending_roster')
execute function jfl_private.notify_approved_team_application();

comment on function jfl_private.notify_approved_team_application() is
  '#3637: fixed operational approval Notice; applicant only, same transaction, one event per application/recipient; no social/broadcast API.';
