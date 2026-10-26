-- #3637: READ ONLY installed-object verification, not product acceptance.
begin read only;
do $verify$
begin
  if not exists(select 1 from pg_proc where oid=to_regprocedure('jfl_private.notify_approved_team_application()')
    and not prosecdef and pg_get_userbyid(proowner)='postgres'
    and proconfig=array['search_path=""']::text[] and md5(prosrc)='aea7dfcdb594e548ee03990780d935fb')
  then raise exception 'Approval Notice producer definition/authority differs'; end if;
  if has_function_privilege('anon','jfl_private.notify_approved_team_application()','execute')
    or has_function_privilege('authenticated','jfl_private.notify_approved_team_application()','execute')
    or has_table_privilege('anon','jfl.user_notifications','select,insert,update,delete')
    or has_table_privilege('authenticated','jfl.user_notifications','select,insert,update,delete')
    or not (select relrowsecurity from pg_class where oid='jfl.user_notifications'::regclass)
    or exists(select 1 from pg_policy where polrelid='jfl.user_notifications'::regclass)
  then raise exception 'Approval Notice browser boundary differs'; end if;
  if not exists(select 1 from pg_index where indexrelid=to_regclass('jfl.user_notifications_application_approval_once')
    and indrelid='jfl.user_notifications'::regclass and indisunique and indisvalid and indnkeyatts=2
    and pg_get_indexdef(indexrelid,1,true)='recipient_user_id'
    and pg_get_indexdef(indexrelid,2,true) like '%payload%teamApplicationId%'
    and pg_get_expr(indpred,indrelid)='(kind = ''team_application_approved''::text)')
  then raise exception 'Approval Notice event dedupe index differs'; end if;
  if not exists(select 1 from pg_trigger where tgrelid='jfl_private.team_applications'::regclass
    and tgname='team_application_approval_notice' and not tgisinternal and tgtype=17 and tgenabled='O'
    and tgfoid='jfl_private.notify_approved_team_application()'::regprocedure
    and tgattr::text=(select attnum::text from pg_attribute where attrelid='jfl_private.team_applications'::regclass and attname='status'))
  then raise exception 'Approval Notice trigger binding differs'; end if;
  if md5((select prosrc from pg_proc where oid='jfl.admin_review_team_application(uuid,uuid,text,text)'::regprocedure))<>'7c5596bec3ff5f9c45e14de5c1d2bb0a'
    or md5((select prosrc from pg_proc where oid='jfl.list_my_notifications(uuid,integer)'::regprocedure))<>'0d087a96d4198c78f5d8bbcde511425c'
  then raise exception 'Existing approval/Notice read entrypoint changed'; end if;
end;
$verify$;
select jsonb_build_object('scope','READ ONLY installed objects; not live delivery acceptance',
  'producerSourceMd5','aea7dfcdb594e548ee03990780d935fb',
  'index',pg_get_indexdef('jfl.user_notifications_application_approval_once'::regclass),
  'trigger',(select pg_get_triggerdef(oid) from pg_trigger where tgrelid='jfl_private.team_applications'::regclass and tgname='team_application_approval_notice')) as proof;
rollback;
