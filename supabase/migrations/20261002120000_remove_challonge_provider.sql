-- #87 Challonge is not a reporting path. Keep historical rows as other.

update public.player_external_identities
  set provider = 'other'
  where provider = 'challonge';

alter table public.player_external_identities
  drop constraint if exists player_external_identities_provider_check;

alter table public.player_external_identities
  add constraint player_external_identities_provider_check
  check (provider in ('fargo', 'fremont_open', 'other'));

update public.external_tournament_events
  set source = 'other'
  where source = 'challonge';

alter table public.external_tournament_events
  drop constraint if exists external_tournament_events_source_check;

alter table public.external_tournament_events
  add constraint external_tournament_events_source_check
  check (source in ('fremont_open', 'other'));
