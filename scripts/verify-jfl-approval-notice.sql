-- #3637: exclusive JFL lease and installed-object inspection required first.
-- ROLLBACK-ONLY normal RPC proof, not HTTP/browser acceptance. Independently
-- capture/read back prior hashes before/after; no fixture overlap is allowed.
begin;
set local statement_timeout='30s';
set local role service_role;
do $proof$
declare
  admin_id uuid := '18580000-0000-4000-8000-000000000002';
  applicant_id uuid := '18580000-0000-4000-8000-000000000004';
  owned_season uuid; application_id uuid; approved_team uuid; notice_id uuid;
  fixture_date date; changed integer; denied boolean;
begin
  if not exists(select 1 from jfl_private.league_admins where user_id=admin_id)
    or exists(select 1 from jfl_private.league_admins where user_id=applicant_id)
    or (select count(*) from jfl.players where user_id=applicant_id)<>1
  then raise exception 'Known synthetic applicant/Admin qualification failed'; end if;
  select scheduled_on into fixture_date from jfl.rounds where id='18580000-1200-4000-8000-000000000001' and season_id='18580000-1000-4000-8000-000000000000';
  if fixture_date is null then raise exception 'Current trusted fixture date required'; end if;
  select id into owned_season from jfl.create_season_setup(admin_id,'JFL QA #3637 rollback Notice','QA rollback proof',fixture_date,5,3,5,7,array[1,2,3,4],'season-1-default',4,true,'qa');
  select id into application_id from jfl.submit_team_application(applicant_id,owned_season,'JFL QA #3637 rollback team');
  if application_id is null then raise exception 'Normal application did not return an identity'; end if;
  denied:=false;
  begin perform jfl.admin_review_team_application(applicant_id,application_id,'approve',null);
  exception when others then if sqlerrm<>'Actor is not a league admin' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Non-Admin approval was accepted'; end if;
  select result.team_id into approved_team from jfl.admin_review_team_application(admin_id,application_id,'approve','JFL QA private reviewer note') result;
  select id into notice_id from jfl.user_notifications where kind='team_application_approved' and payload->>'teamApplicationId'=application_id::text and recipient_user_id=applicant_id;
  if approved_team is null or notice_id is null or (select count(*) from jfl.user_notifications where kind='team_application_approved' and payload->>'teamApplicationId'=application_id::text)<>1
  then raise exception 'Exactly one approved-team applicant Notice required'; end if;
  if not exists(select 1 from jfl.user_notifications where id=notice_id and title='Team application approved'
    and href='/teams?view=mine' and team_id=approved_team and season_id=owned_season and created_by=admin_id and read_at is null
    and body like '%JFL QA #3637 rollback team%' and body like '%JFL QA #3637 rollback Notice%' and body not like '%private reviewer note%')
  then raise exception 'Operational Notice identity/template differs'; end if;
  if not exists(select 1 from jfl.list_my_notifications(applicant_id,100) n where n.id=notice_id)
    or exists(select 1 from jfl.list_my_notifications(admin_id,100) n where n.id=notice_id)
  then raise exception 'Notice recipient list isolation failed'; end if;
  select count(*) into changed from jfl.mark_my_notification_read(admin_id,notice_id);
  if changed<>0 or exists(select 1 from jfl.user_notifications where id=notice_id and read_at is not null)
  then raise exception 'Reviewer modified another recipient Notice'; end if;
  select count(*) into changed from jfl.mark_my_notification_read(applicant_id,notice_id);
  if changed<>1 or not exists(select 1 from jfl.user_notifications where id=notice_id and read_at is not null)
  then raise exception 'Recipient read state failed'; end if;
  denied:=false;
  begin perform jfl.admin_review_team_application(admin_id,application_id,'approve',null);
  exception when others then if sqlerrm<>'Team application is no longer waiting for review' then raise; end if; denied:=true; end;
  if not denied or (select count(*) from jfl.user_notifications where kind='team_application_approved' and payload->>'teamApplicationId'=application_id::text)<>1
  then raise exception 'Duplicate approval created another Notice'; end if;
  if has_function_privilege('anon','jfl_private.notify_approved_team_application()','execute') or has_function_privilege('authenticated','jfl_private.notify_approved_team_application()','execute')
  then raise exception 'Browser role can invoke the producer'; end if;
end;
$proof$;
select 'PASS rollback-only approval/recipient/template/read/duplicate/role proof; independent prior-hash readback still required' as proof;
rollback;
