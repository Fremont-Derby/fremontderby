-- #2300: JFL-only notification trigger hardening.
-- Fail closed if the inspected function or its sole enabled trigger drifted.
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace pn on pn.oid = p.pronamespace
    join pg_trigger t on t.tgfoid = p.oid
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace tn on tn.oid = c.relnamespace
    where pn.nspname = 'jfl'
      and p.proname = 'user_notifications_sync_user_ids'
      and p.pronargs = 0
      and p.prorettype = 'pg_catalog.trigger'::regtype
      and not p.prosecdef
      and p.proconfig is null
      and md5(p.prosrc) = '5f3eeabb41b5b43fb18f89d44789a316'
      and (select count(*) from pg_trigger other where other.tgfoid = p.oid and not other.tgisinternal) = 1
      and tn.nspname = 'jfl'
      and c.relname = 'user_notifications'
      and t.tgname = 'user_notifications_sync_user_ids'
      and t.tgenabled = 'O'
      and not t.tgisinternal
  ) then
    raise exception 'JFL notification trigger baseline changed; inspect before hardening';
  end if;
end;
$$;

-- The body refers only to NEW fields and pg_catalog built-ins, so an empty
-- search_path is sufficient and does not change trigger behavior.
alter function jfl.user_notifications_sync_user_ids() set search_path = '';
revoke execute on function jfl.user_notifications_sync_user_ids()
  from public, anon, authenticated;

-- Existing explicit service_role EXECUTE is retained for compatibility.
-- It is not needed by the inspected trigger's postgres-owned insert path,
-- but removing it is outside this card's required grant boundary.
-- Exact rollback (JFL only, if needed):
--   alter function jfl.user_notifications_sync_user_ids() reset search_path;
--   grant execute on function jfl.user_notifications_sync_user_ids() to public;
