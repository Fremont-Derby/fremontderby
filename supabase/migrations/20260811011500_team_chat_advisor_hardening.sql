create policy "Browser roles cannot access team chat messages"
on public.team_chat_messages
for all
to anon, authenticated
using (false)
with check (false);

create policy "Browser roles cannot access team chat reads"
on public.team_chat_reads
for all
to anon, authenticated
using (false)
with check (false);

create index team_chat_messages_author_player_idx
  on public.team_chat_messages (author_player_id);

create index team_chat_messages_season_team_idx
  on public.team_chat_messages (season_id, team_id);

create index team_chat_messages_team_season_idx
  on public.team_chat_messages (team_id, season_id);

create index team_chat_messages_removed_by_idx
  on public.team_chat_messages (removed_by);

create index team_chat_reads_player_idx
  on public.team_chat_reads (player_id);

create index team_chat_reads_season_team_idx
  on public.team_chat_reads (season_id, team_id);

create index team_chat_reads_team_season_idx
  on public.team_chat_reads (team_id, season_id);
