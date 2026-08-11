create table if not exists private.sandbox_feedback (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  surface text not null,
  page_path text not null,
  context jsonb not null default '{}'::jsonb,
  comment text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  constraint sandbox_feedback_surface_check check (surface in ('demo', 'player', 'captain')),
  constraint sandbox_feedback_path_check check (char_length(page_path) between 1 and 160),
  constraint sandbox_feedback_comment_check check (char_length(comment) between 1 and 2000),
  constraint sandbox_feedback_status_check check (status in ('open', 'reviewed'))
);

create index if not exists sandbox_feedback_review_queue_idx
  on private.sandbox_feedback(status, created_at desc);

alter table private.sandbox_feedback enable row level security;
revoke all on private.sandbox_feedback from public, anon, authenticated;
grant select, insert, update on private.sandbox_feedback to service_role;

create or replace function public.submit_sandbox_feedback(
  actor_user_id uuid,
  feedback_surface text,
  feedback_path text,
  feedback_context jsonb,
  feedback_comment text
)
returns table(
  id uuid,
  surface text,
  page_path text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_path text := btrim(feedback_path);
  normalized_comment text := btrim(feedback_comment);
  inserted_id uuid;
begin
  if actor_user_id is null or not exists (
    select 1 from auth.users u where u.id = actor_user_id
  ) then
    raise exception 'Authenticated user is required';
  end if;
  if feedback_surface not in ('demo', 'player', 'captain') then
    raise exception 'Invalid sandbox feedback surface';
  end if;
  if normalized_path is null or char_length(normalized_path) not between 1 and 160 then
    raise exception 'Feedback path is required and must be 160 characters or fewer';
  end if;
  if normalized_comment is null or char_length(normalized_comment) not between 1 and 2000 then
    raise exception 'Feedback comment is required and must be 2000 characters or fewer';
  end if;
  if feedback_context is null or jsonb_typeof(feedback_context) <> 'object' then
    raise exception 'Feedback context must be an object';
  end if;

  insert into private.sandbox_feedback(
    actor_user_id,
    surface,
    page_path,
    context,
    comment
  ) values (
    actor_user_id,
    feedback_surface,
    normalized_path,
    feedback_context,
    normalized_comment
  )
  returning private.sandbox_feedback.id into inserted_id;

  return query
  select sf.id, sf.surface, sf.page_path, sf.status, sf.created_at
  from private.sandbox_feedback sf
  where sf.id = inserted_id;
end;
$$;

create or replace function public.list_sandbox_feedback(
  actor_user_id uuid,
  status_filter text default 'open',
  result_limit integer default 100
)
returns table(
  id uuid,
  feedback_actor_user_id uuid,
  surface text,
  page_path text,
  context jsonb,
  comment text,
  status text,
  created_at timestamptz,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'League admin access is required';
  end if;
  if status_filter is not null and status_filter not in ('open', 'reviewed') then
    raise exception 'Invalid feedback status';
  end if;
  if result_limit not between 1 and 250 then
    raise exception 'result_limit must be between 1 and 250';
  end if;

  return query
  select sf.id,
         sf.actor_user_id,
         sf.surface,
         sf.page_path,
         sf.context,
         sf.comment,
         sf.status,
         sf.created_at,
         sf.reviewed_at
  from private.sandbox_feedback sf
  where status_filter is null or sf.status = status_filter
  order by sf.created_at desc
  limit result_limit;
end;
$$;

create or replace function public.resolve_sandbox_feedback(
  actor_user_id uuid,
  target_feedback_id uuid
)
returns table(
  id uuid,
  status text,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'League admin access is required';
  end if;

  update private.sandbox_feedback sf
  set status = 'reviewed',
      reviewed_at = now(),
      reviewed_by_user_id = actor_user_id
  where sf.id = target_feedback_id
    and sf.status = 'open';

  if not found then
    raise exception 'Open sandbox feedback not found';
  end if;

  return query
  select sf.id, sf.status, sf.reviewed_at
  from private.sandbox_feedback sf
  where sf.id = target_feedback_id;
end;
$$;

revoke all on function public.submit_sandbox_feedback(uuid, text, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.list_sandbox_feedback(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.resolve_sandbox_feedback(uuid, uuid) from public, anon, authenticated;
grant execute on function public.submit_sandbox_feedback(uuid, text, text, jsonb, text) to service_role;
grant execute on function public.list_sandbox_feedback(uuid, text, integer) to service_role;
grant execute on function public.resolve_sandbox_feedback(uuid, uuid) to service_role;
