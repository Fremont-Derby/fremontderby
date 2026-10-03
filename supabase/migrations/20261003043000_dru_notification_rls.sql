-- #2887 DRU notification reads stay on the Worker. Browser roles get no table grant.
do $$
begin
  if to_regclass('dru.user_notifications') is null then
    return;
  end if;
  execute 'alter table dru.user_notifications enable row level security';
  execute 'revoke all on table dru.user_notifications from public, anon, authenticated';
  execute 'grant select, insert, update on table dru.user_notifications to service_role';
  execute 'comment on table dru.user_notifications is ''Worker-mediated notifications. Anonymous and authenticated clients have no table grant.''';
end $$;
