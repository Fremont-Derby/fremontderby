-- #2887 Drop any browser policy and keep notification reads on the Worker.
do $$
declare
  policy_name text;
begin
  if to_regclass('dru.user_notifications') is null then
    return;
  end if;
  execute 'alter table dru.user_notifications enable row level security';
  execute 'alter table dru.user_notifications force row level security';
  for policy_name in
    select pol.polname
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace ns on ns.oid = cls.relnamespace
    where ns.nspname = 'dru' and cls.relname = 'user_notifications'
  loop
    execute format('drop policy if exists %I on dru.user_notifications', policy_name);
  end loop;
  execute 'revoke all on table dru.user_notifications from public, anon, authenticated';
  execute 'revoke all on sequence dru.user_notifications_id_seq from public, anon, authenticated';
  execute 'grant select, insert, update on table dru.user_notifications to service_role';
  execute 'create policy dru_notifications_browser_deny on dru.user_notifications as restrictive for all to anon, authenticated using (false)';
  execute 'comment on table dru.user_notifications is ''Worker-mediated notifications. Browser roles are denied.''';
end $$;
