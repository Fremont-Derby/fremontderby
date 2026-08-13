-- #526: completed league seasons must not retain unresolved team matches.
-- QA seasons remain exempt because they may intentionally preserve partial fixtures.

create or replace function private.guard_explicit_season_close()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'complete'
     and old.status is distinct from 'complete'
     and coalesce(new.purpose, 'league') = 'league'
     and exists (
       select 1
       from public.rounds r
       join public.team_matches tm on tm.round_id = r.id
       where r.season_id = new.id
         and tm.status not in ('finalized', 'corrected')
     ) then
    raise exception 'Competitive team matchups still need final results before closing the season';
  end if;

  if new.status = 'complete'
     and old.status is distinct from 'complete'
     and coalesce(current_setting('fremont.explicit_season_close', true), '') <> 'on' then
    new.status := old.status;
  end if;

  return new;
end;
$$;
