-- #3637: exceptional rollback only, with the exclusive JFL fixture lease.
-- Never run during browser/reset/SQL activity. Preserve all Notice/audit rows.
do $rollback$
declare
  before_hash text;
  after_hash text;
begin
  if current_user<>'postgres' or not exists(select 1 from pg_proc
    where oid=to_regprocedure('jfl_private.notify_approved_team_application()')
      and not prosecdef and pg_get_userbyid(proowner)='postgres'
      and proconfig=array['search_path=""']::text[] and md5(prosrc)='aea7dfcdb594e548ee03990780d935fb')
  then raise exception 'Qualified Approval Notice producer required before rollback'; end if;
  if not exists(select 1 from pg_trigger where tgrelid='jfl_private.team_applications'::regclass
      and tgname='team_application_approval_notice' and tgfoid='jfl_private.notify_approved_team_application()'::regprocedure)
    or not exists(select 1 from pg_index where indexrelid=to_regclass('jfl.user_notifications_application_approval_once')
      and indrelid='jfl.user_notifications'::regclass and indisunique and indisvalid)
  then raise exception 'Approval Notice binding/index differs; do not drop unfamiliar objects'; end if;
  lock table jfl.user_notifications in access exclusive mode;
  select md5(coalesce(string_agg(to_jsonb(n)::text,'|' order by id),'')) into before_hash from jfl.user_notifications n;
  execute 'drop trigger team_application_approval_notice on jfl_private.team_applications';
  execute 'drop function jfl_private.notify_approved_team_application()';
  execute 'drop index jfl.user_notifications_application_approval_once';
  select md5(coalesce(string_agg(to_jsonb(n)::text,'|' order by id),'')) into after_hash from jfl.user_notifications n;
  if before_hash is distinct from after_hash then raise exception 'Rollback changed Notice data'; end if;
end;
$rollback$;
select 'PASS removed only the qualified approval producer; all Notice rows and read state preserved' as proof;
