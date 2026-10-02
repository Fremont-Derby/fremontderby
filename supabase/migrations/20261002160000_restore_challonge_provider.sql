-- Story 87 may use Challonge again. Keep the public feed.

alter table public.player_external_identities
  drop constraint if exists player_external_identities_provider_check;
alter table public.player_external_identities
  add constraint player_external_identities_provider_check
  check (provider in ('fargo', 'fremont_open', 'challonge', 'other'));

alter table public.external_tournament_events
  drop constraint if exists external_tournament_events_source_check;
alter table public.external_tournament_events
  add constraint external_tournament_events_source_check
  check (source in ('fremont_open', 'challonge', 'other'));
