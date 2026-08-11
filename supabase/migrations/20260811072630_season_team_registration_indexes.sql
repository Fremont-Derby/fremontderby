
create index if not exists season_team_slots_source_team_fk_idx
  on private.season_team_slots(source_team_id)
  where source_team_id is not null;
create index if not exists season_team_slots_team_fk_idx
  on private.season_team_slots(team_id)
  where team_id is not null;
create index if not exists season_team_slots_returning_captain_fk_idx
  on private.season_team_slots(returning_captain_player_id)
  where returning_captain_player_id is not null;
create index if not exists season_team_slots_assigned_captain_fk_idx
  on private.season_team_slots(assigned_captain_player_id)
  where assigned_captain_player_id is not null;

create index if not exists team_applications_applicant_player_fk_idx
  on private.team_applications(applicant_player_id);
create index if not exists team_applications_team_fk_idx
  on private.team_applications(team_id)
  where team_id is not null;
create index if not exists team_applications_slot_fk_idx
  on private.team_applications(slot_id)
  where slot_id is not null;
create index if not exists team_applications_reviewer_fk_idx
  on private.team_applications(reviewed_by_user_id)
  where reviewed_by_user_id is not null;
