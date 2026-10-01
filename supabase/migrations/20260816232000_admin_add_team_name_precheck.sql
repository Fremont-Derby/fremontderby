-- P1: product error before teams_season_id_name_key on admin add team.

CREATE OR REPLACE FUNCTION public.admin_add_team_to_season(actor_user_id uuid, target_season_id uuid, candidate_team_id uuid)
 RETURNS TABLE(slot_id uuid, team_id uuid, team_name text, slot_status text, created_team boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 source_team public.teams%rowtype; target_season public.seasons%rowtype; assigned_team_id uuid; assigned_slot_id uuid; assigned_captain_player_id uuid; occupied_slots integer; created_new_team boolean:=false; initial_status text;
begin
 if not exists(select 1 from private.league_admins la where la.user_id=actor_user_id) then raise exception 'Actor is not a league admin'; end if;
 if candidate_team_id is null then raise exception 'candidate_team_id is required'; end if;
 select * into target_season from public.seasons s where s.id=target_season_id for update;
 if not found then raise exception 'Season not found'; end if;
 if target_season.status not in('draft','registration') then raise exception 'Teams can only be added before season publication'; end if;
 select * into source_team from public.teams t where t.id=candidate_team_id;
 if not found then raise exception 'Team not found'; end if;
 perform pg_advisory_xact_lock(hashtextextended('season_team_capacity:'||target_season_id::text,0));
 perform private.expire_season_team_registration(target_season_id);
 select sts.id,sts.team_id into assigned_slot_id,assigned_team_id from private.season_team_slots sts
 where sts.season_id=target_season_id and sts.status in('reserved','transferred','approved_pending_roster','ready','confirmed') and(sts.team_id=candidate_team_id or sts.source_team_id=candidate_team_id)
 order by sts.created_at desc limit 1;
 if assigned_slot_id is not null then
   return query select sts.id,coalesce(sts.team_id,sts.source_team_id),coalesce(current_team.name,source_team_row.name),sts.status,false
   from private.season_team_slots sts left join public.teams current_team on current_team.id=sts.team_id left join public.teams source_team_row on source_team_row.id=sts.source_team_id where sts.id=assigned_slot_id; return;
 end if;
 select count(*)::integer into occupied_slots from private.season_team_slots sts where sts.season_id=target_season_id and sts.status in('reserved','transferred','approved_pending_roster','ready','confirmed');
 if occupied_slots>=target_season.team_capacity then raise exception 'No team slots are currently available'; end if;
 if source_team.season_id=target_season_id then assigned_team_id:=source_team.id; else
   select t.id into assigned_team_id from public.teams t where t.season_id=target_season_id and lower(btrim(t.name))=lower(btrim(source_team.name)) limit 1;
   if assigned_team_id is null then
      if exists (
        select 1 from public.teams t
        where t.season_id = target_season_id
          and lower(btrim(t.name)) = lower(btrim(source_team.name))
      ) then
        raise exception 'That team name is already used in this season';
      end if;
      insert into public.teams(season_id,name,created_by) values(target_season_id,source_team.name,actor_user_id) returning public.teams.id into assigned_team_id;
      created_new_team:=true;
    end if;
 end if;
 select sts.id into assigned_slot_id from private.season_team_slots sts where sts.season_id=target_season_id and sts.team_id=assigned_team_id and sts.status in('reserved','transferred','approved_pending_roster','ready','confirmed') order by sts.created_at desc limit 1;
 if assigned_slot_id is not null then return query select sts.id,sts.team_id,target_team.name,sts.status,false from private.season_team_slots sts join public.teams target_team on target_team.id=sts.team_id where sts.id=assigned_slot_id; return; end if;
 select tm.player_id into assigned_captain_player_id from public.team_memberships tm where tm.team_id=assigned_team_id and tm.season_id=target_season_id and tm.role='captain' and tm.ends_at is null order by tm.starts_at desc limit 1;
 initial_status:=case when(select count(*) from public.team_memberships tm where tm.team_id=assigned_team_id and tm.season_id=target_season_id and tm.ends_at is null)>=target_season.minimum_committed_roster then 'ready' else 'approved_pending_roster' end;
 insert into private.season_team_slots(season_id,source_team_id,team_id,assigned_captain_player_id,status,last_action_reason) values(target_season_id,case when source_team.season_id=target_season_id then null else source_team.id end,assigned_team_id,assigned_captain_player_id,initial_status,'Added manually by league admin') returning private.season_team_slots.id into assigned_slot_id;
 insert into private.audit_events(actor_user_id,action,entity_type,entity_id,after_state) values(actor_user_id,'season.admin_add_team','season_team_slot',assigned_slot_id,jsonb_build_object('seasonId',target_season_id,'sourceTeamId',source_team.id,'teamId',assigned_team_id,'teamName',source_team.name,'createdSeasonTeam',created_new_team,'copiedRoster',false,'status',initial_status));
 return query select assigned_slot_id,assigned_team_id,source_team.name,initial_status,created_new_team;
end;
$function$
;
