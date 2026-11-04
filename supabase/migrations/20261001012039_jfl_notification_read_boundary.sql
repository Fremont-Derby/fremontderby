-- #2545: prevent direct JFL notification reads and actor-spoofable RPC calls.
-- The Worker uses its isolated service_role path; public clients have no
-- notification-table or notification-RPC contract.
do $$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'jfl'
      and c.relname = 'user_notifications'
      and c.relkind = 'r'
      and not c.relrowsecurity
      and not c.relforcerowsecurity
      and c.relacl::text = '{postgres=arwdDxtm/postgres,anon=r/postgres,authenticated=r/postgres,service_role=r/postgres}'
      and not exists (
        select 1 from pg_policy policy where policy.polrelid = c.oid
      )
  ) then
    raise exception 'JFL notification table grants or RLS baseline changed';
  end if;

  if (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join (values
      ('admin_broadcast_notification', 5, '5a164ec1a32fdf465017d911026292b4'),
      ('create_user_notification', 9, 'ff88b567837e8c553738ec35e4c7a209'),
      ('list_my_notifications', 2, '0d087a96d4198c78f5d8bbcde511425c'),
      ('mark_all_my_notifications_read', 1, '88131662465a0b15f2937598f6742cb7'),
      ('mark_my_notification_read', 2, 'ef239179a955693bef7717d33f991cbe')
    ) expected(name, argument_count, body_md5)
      on expected.name = p.proname and expected.argument_count = p.pronargs
    where n.nspname = 'jfl'
      and p.prosecdef
      and p.proconfig = array['search_path=""']::text[]
      and md5(p.prosrc) = expected.body_md5
      and has_function_privilege('anon', p.oid, 'EXECUTE')
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
      and has_function_privilege('service_role', p.oid, 'EXECUTE')
  ) <> 5 then
    raise exception 'JFL notification RPC baseline changed';
  end if;
end;
$$;

alter table jfl.user_notifications enable row level security;
revoke select on table jfl.user_notifications from anon, authenticated;

-- All five functions are SECURITY DEFINER and accept caller-supplied actor IDs.
-- Keep them available only to the trusted service role; do not add client RLS
-- policies until an independently authenticated actor contract exists.
revoke execute on function jfl.admin_broadcast_notification(uuid, text, text, uuid, text)
  from public, anon, authenticated;
revoke execute on function jfl.create_user_notification(uuid, text, text, text, text, uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
revoke execute on function jfl.list_my_notifications(uuid, integer)
  from public, anon, authenticated;
revoke execute on function jfl.mark_all_my_notifications_read(uuid)
  from public, anon, authenticated;
revoke execute on function jfl.mark_my_notification_read(uuid, uuid)
  from public, anon, authenticated;

-- Exact rollback to the inspected JFL baseline, if required:
--   alter table jfl.user_notifications disable row level security;
--   grant select on table jfl.user_notifications to anon, authenticated;
--   grant execute on function jfl.admin_broadcast_notification(uuid, text, text, uuid, text) to public, anon, authenticated;
--   grant execute on function jfl.create_user_notification(uuid, text, text, text, text, uuid, uuid, uuid, uuid) to public, anon, authenticated;
--   grant execute on function jfl.list_my_notifications(uuid, integer) to public, anon, authenticated;
--   grant execute on function jfl.mark_all_my_notifications_read(uuid) to public, anon, authenticated;
--   grant execute on function jfl.mark_my_notification_read(uuid, uuid) to public, anon, authenticated;
