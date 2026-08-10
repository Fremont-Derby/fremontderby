create table public.season_prize_configurations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  version integer not null check (version > 0),
  entry_fee_cents integer not null check (entry_fee_cents >= 0),
  administration_amount_cents integer not null check (administration_amount_cents >= 0),
  team_allocation_basis_points integer not null
    check (team_allocation_basis_points between 0 and 10000),
  individual_allocation_basis_points integer not null
    check (individual_allocation_basis_points between 0 and 10000),
  projected_field_size integer not null check (projected_field_size > 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (season_id, version),
  check (team_allocation_basis_points + individual_allocation_basis_points = 10000)
);

create table public.season_prize_payout_templates (
  configuration_id uuid not null references public.season_prize_configurations(id) on delete cascade,
  pool text not null check (pool in ('team', 'individual')),
  place integer not null check (place > 0),
  label text not null check (char_length(label) between 1 and 80),
  allocation_basis_points integer not null check (allocation_basis_points between 0 and 10000),
  primary key (configuration_id, pool, place)
);

create table public.season_final_prize_payouts (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  pool text not null check (pool in ('team', 'individual')),
  place integer not null check (place > 0),
  label text not null check (char_length(label) between 1 and 80),
  amount_cents integer not null check (amount_cents >= 0),
  finalized_by uuid not null references auth.users(id) on delete restrict,
  finalized_at timestamptz not null default now(),
  unique (season_id, pool, place)
);

alter table public.season_prize_configurations enable row level security;
alter table public.season_prize_payout_templates enable row level security;
alter table public.season_final_prize_payouts enable row level security;

grant select on public.season_prize_configurations, public.season_prize_payout_templates, public.season_final_prize_payouts
  to anon, authenticated;
grant all on public.season_prize_configurations, public.season_prize_payout_templates, public.season_final_prize_payouts
  to service_role;

create policy "Prize configurations are publicly readable"
on public.season_prize_configurations for select
to anon, authenticated
using (true);

create policy "Prize payout templates are publicly readable"
on public.season_prize_payout_templates for select
to anon, authenticated
using (true);

create policy "Final prize payouts are publicly readable"
on public.season_final_prize_payouts for select
to anon, authenticated
using (true);

create or replace function private.prevent_final_prize_payout_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Finalized prize payouts are immutable';
end;
$$;

create trigger prevent_final_prize_payout_update
before update or delete on public.season_final_prize_payouts
for each row execute function private.prevent_final_prize_payout_mutation();

revoke all on function private.prevent_final_prize_payout_mutation() from public;

create or replace function public.configure_season_prizes(
  actor_user_id uuid,
  target_season_id uuid,
  configured_entry_fee_cents integer,
  configured_administration_amount_cents integer,
  configured_team_allocation_basis_points integer,
  configured_individual_allocation_basis_points integer,
  configured_projected_field_size integer,
  payout_templates jsonb
)
returns table (
  configuration_id uuid,
  season_id uuid,
  version integer,
  entry_fee_cents integer,
  administration_amount_cents integer,
  team_allocation_basis_points integer,
  individual_allocation_basis_points integer,
  projected_field_size integer,
  projected_gross_cents integer,
  projected_prize_pool_cents integer,
  team_prize_pool_cents integer,
  individual_prize_pool_cents integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_version integer;
  inserted_configuration_id uuid;
  previous_configuration jsonb;
  projected_gross integer;
  projected_prize_pool integer;
  payout_item jsonb;
  payout_pool text;
  payout_place integer;
  payout_label text;
  payout_basis_points integer;
  team_template_total integer := 0;
  individual_template_total integer := 0;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_season_id is null then
    raise exception 'target_season_id is required';
  end if;

  if not exists (
    select 1
    from private.league_admins la
    where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  perform 1
  from public.seasons s
  where s.id = target_season_id
  for update;

  if not found then
    raise exception 'Season not found';
  end if;

  if configured_entry_fee_cents is null or configured_entry_fee_cents < 0 then
    raise exception 'entry_fee_cents must be zero or greater';
  end if;

  if configured_administration_amount_cents is null or configured_administration_amount_cents < 0 then
    raise exception 'administration_amount_cents must be zero or greater';
  end if;

  if configured_projected_field_size is null or configured_projected_field_size <= 0 then
    raise exception 'projected_field_size must be greater than zero';
  end if;

  if configured_team_allocation_basis_points is null
      or configured_individual_allocation_basis_points is null
      or configured_team_allocation_basis_points < 0
      or configured_individual_allocation_basis_points < 0
      or configured_team_allocation_basis_points + configured_individual_allocation_basis_points <> 10000 then
    raise exception 'Prize allocations must total 10000 basis points';
  end if;

  projected_gross := configured_entry_fee_cents * configured_projected_field_size;
  if configured_administration_amount_cents > projected_gross then
    raise exception 'administration_amount_cents cannot exceed projected gross';
  end if;

  if jsonb_typeof(payout_templates) is distinct from 'array' then
    raise exception 'payout_templates must be an array';
  end if;

  for payout_item in
    select value from jsonb_array_elements(payout_templates)
  loop
    if jsonb_typeof(payout_item) is distinct from 'object' then
      raise exception 'Each payout template must be an object';
    end if;

    payout_pool := payout_item ->> 'pool';
    payout_place := nullif(payout_item ->> 'place', '')::integer;
    payout_label := btrim(coalesce(payout_item ->> 'label', ''));
    payout_basis_points := coalesce(
      nullif(payout_item ->> 'allocationBasisPoints', '')::integer,
      nullif(payout_item ->> 'allocation_basis_points', '')::integer
    );

    if payout_pool not in ('team', 'individual') then
      raise exception 'Payout template pool must be team or individual';
    end if;

    if payout_place is null or payout_place <= 0 then
      raise exception 'Payout template place must be greater than zero';
    end if;

    if payout_label is null or char_length(payout_label) = 0 or char_length(payout_label) > 80 then
      raise exception 'Payout template label must be 80 characters or fewer';
    end if;

    if payout_basis_points is null or payout_basis_points < 0 or payout_basis_points > 10000 then
      raise exception 'Payout template allocation must be between 0 and 10000 basis points';
    end if;

    if payout_pool = 'team' then
      team_template_total := team_template_total + payout_basis_points;
    else
      individual_template_total := individual_template_total + payout_basis_points;
    end if;
  end loop;

  if team_template_total <> 10000 then
    raise exception 'Team payout templates must total 10000 basis points';
  end if;

  if individual_template_total <> 10000 then
    raise exception 'Individual payout templates must total 10000 basis points';
  end if;

  select to_jsonb(spc)
    into previous_configuration
  from public.season_prize_configurations spc
  where spc.season_id = target_season_id
  order by spc.version desc
  limit 1;

  select coalesce(max(spc.version), 0) + 1
    into next_version
  from public.season_prize_configurations spc
  where spc.season_id = target_season_id;

  insert into public.season_prize_configurations (
    season_id,
    version,
    entry_fee_cents,
    administration_amount_cents,
    team_allocation_basis_points,
    individual_allocation_basis_points,
    projected_field_size,
    created_by
  ) values (
    target_season_id,
    next_version,
    configured_entry_fee_cents,
    configured_administration_amount_cents,
    configured_team_allocation_basis_points,
    configured_individual_allocation_basis_points,
    configured_projected_field_size,
    actor_user_id
  )
  returning season_prize_configurations.id into inserted_configuration_id;

  for payout_item in
    select value from jsonb_array_elements(payout_templates)
  loop
    insert into public.season_prize_payout_templates (
      configuration_id,
      pool,
      place,
      label,
      allocation_basis_points
    ) values (
      inserted_configuration_id,
      payout_item ->> 'pool',
      nullif(payout_item ->> 'place', '')::integer,
      btrim(coalesce(payout_item ->> 'label', '')),
      coalesce(
        nullif(payout_item ->> 'allocationBasisPoints', '')::integer,
        nullif(payout_item ->> 'allocation_basis_points', '')::integer
      )
    );
  end loop;

  insert into private.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state
  ) values (
    actor_user_id,
    'season.configure_prizes',
    'season',
    target_season_id,
    previous_configuration,
    jsonb_build_object(
      'configurationId', inserted_configuration_id,
      'version', next_version,
      'projectedFieldSize', configured_projected_field_size
    )
  );

  projected_prize_pool := greatest(projected_gross - configured_administration_amount_cents, 0);

  return query
  select
    spc.id,
    spc.season_id,
    spc.version,
    spc.entry_fee_cents,
    spc.administration_amount_cents,
    spc.team_allocation_basis_points,
    spc.individual_allocation_basis_points,
    spc.projected_field_size,
    projected_gross,
    projected_prize_pool,
    round(projected_prize_pool::numeric * spc.team_allocation_basis_points::numeric / 10000)::integer,
    round(projected_prize_pool::numeric * spc.individual_allocation_basis_points::numeric / 10000)::integer,
    spc.created_at
  from public.season_prize_configurations spc
  where spc.id = inserted_configuration_id;
end;
$$;

create or replace function public.finalize_season_prize_payouts(
  actor_user_id uuid,
  target_season_id uuid,
  finalized_payouts jsonb
)
returns table (
  season_id uuid,
  pool text,
  place integer,
  label text,
  amount_cents integer,
  finalized_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  payout_item jsonb;
  payout_pool text;
  payout_place integer;
  payout_label text;
  payout_amount_cents integer;
  inserted_payouts jsonb;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_season_id is null then
    raise exception 'target_season_id is required';
  end if;

  if not exists (
    select 1
    from private.league_admins la
    where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  perform 1
  from public.seasons s
  where s.id = target_season_id
  for update;

  if not found then
    raise exception 'Season not found';
  end if;

  if exists (
    select 1
    from public.season_final_prize_payouts sfpp
    where sfpp.season_id = target_season_id
  ) then
    raise exception 'Season prize payouts are already finalized';
  end if;

  if jsonb_typeof(finalized_payouts) is distinct from 'array' then
    raise exception 'finalized_payouts must be an array';
  end if;

  for payout_item in
    select value from jsonb_array_elements(finalized_payouts)
  loop
    if jsonb_typeof(payout_item) is distinct from 'object' then
      raise exception 'Each finalized payout must be an object';
    end if;

    payout_pool := payout_item ->> 'pool';
    payout_place := nullif(payout_item ->> 'place', '')::integer;
    payout_label := btrim(coalesce(payout_item ->> 'label', ''));
    payout_amount_cents := coalesce(
      nullif(payout_item ->> 'amountCents', '')::integer,
      nullif(payout_item ->> 'amount_cents', '')::integer
    );

    if payout_pool not in ('team', 'individual') then
      raise exception 'Finalized payout pool must be team or individual';
    end if;

    if payout_place is null or payout_place <= 0 then
      raise exception 'Finalized payout place must be greater than zero';
    end if;

    if payout_label is null or char_length(payout_label) = 0 or char_length(payout_label) > 80 then
      raise exception 'Finalized payout label must be 80 characters or fewer';
    end if;

    if payout_amount_cents is null or payout_amount_cents < 0 then
      raise exception 'Finalized payout amount must be zero or greater';
    end if;

    insert into public.season_final_prize_payouts (
      season_id,
      pool,
      place,
      label,
      amount_cents,
      finalized_by
    ) values (
      target_season_id,
      payout_pool,
      payout_place,
      payout_label,
      payout_amount_cents,
      actor_user_id
    );
  end loop;

  select jsonb_agg(to_jsonb(sfpp) order by sfpp.pool, sfpp.place)
    into inserted_payouts
  from public.season_final_prize_payouts sfpp
  where sfpp.season_id = target_season_id;

  insert into private.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    after_state
  ) values (
    actor_user_id,
    'season.finalize_prize_payouts',
    'season',
    target_season_id,
    jsonb_build_object('payouts', inserted_payouts)
  );

  return query
  select
    sfpp.season_id,
    sfpp.pool,
    sfpp.place,
    sfpp.label,
    sfpp.amount_cents,
    sfpp.finalized_at
  from public.season_final_prize_payouts sfpp
  where sfpp.season_id = target_season_id
  order by sfpp.pool, sfpp.place;
end;
$$;

create or replace function public.get_season_prize_summary(
  target_season_id uuid
)
returns table (
  season_id uuid,
  season_name text,
  season_status text,
  player_count integer,
  paid_amount_cents integer,
  committed_amount_cents integer,
  entry_fee_cents integer,
  administration_amount_cents integer,
  projected_field_size integer,
  projected_gross_cents integer,
  projected_prize_pool_cents integer,
  team_allocation_basis_points integer,
  individual_allocation_basis_points integer,
  team_prize_pool_cents integer,
  individual_prize_pool_cents integer,
  configuration_version integer,
  configured_at timestamptz,
  projected_payouts jsonb,
  finalized_payouts jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with target_season as (
    select s.id, s.name, s.status
    from public.seasons s
    where s.id = target_season_id
  ),
  participant_players as (
    select tm.player_id
    from public.team_memberships tm
    join target_season ts on ts.id = tm.season_id
    where tm.ends_at is null
    union
    select sp.player_id
    from public.season_players sp
    join target_season ts on ts.id = sp.season_id
    where sp.status = 'active'
  ),
  player_totals as (
    select count(distinct pp.player_id)::integer as player_count
    from participant_players pp
  ),
  payment_totals as (
    select coalesce(sum(ps.amount_paid_cents), 0)::integer as paid_amount_cents
    from private.payment_status ps
    join target_season ts on ts.id = ps.season_id
  ),
  latest_configuration as (
    select spc.*
    from public.season_prize_configurations spc
    join target_season ts on ts.id = spc.season_id
    order by spc.version desc
    limit 1
  ),
  computed as (
    select
      ts.id,
      ts.name,
      ts.status,
      pt.player_count,
      pay.paid_amount_cents,
      lc.id as configuration_id,
      lc.entry_fee_cents,
      lc.administration_amount_cents,
      lc.projected_field_size,
      (coalesce(lc.entry_fee_cents, 0) * pt.player_count)::integer as committed_amount_cents,
      (coalesce(lc.entry_fee_cents, 0) * coalesce(lc.projected_field_size, 0))::integer as projected_gross_cents,
      greatest(
        (coalesce(lc.entry_fee_cents, 0) * coalesce(lc.projected_field_size, 0))
          - coalesce(lc.administration_amount_cents, 0),
        0
      )::integer as projected_prize_pool_cents,
      lc.team_allocation_basis_points,
      lc.individual_allocation_basis_points,
      lc.version,
      lc.created_at
    from target_season ts
    cross join player_totals pt
    cross join payment_totals pay
    left join latest_configuration lc on true
  )
  select
    c.id,
    c.name,
    c.status,
    c.player_count,
    c.paid_amount_cents,
    c.committed_amount_cents,
    coalesce(c.entry_fee_cents, 0),
    coalesce(c.administration_amount_cents, 0),
    coalesce(c.projected_field_size, 0),
    c.projected_gross_cents,
    c.projected_prize_pool_cents,
    coalesce(c.team_allocation_basis_points, 0),
    coalesce(c.individual_allocation_basis_points, 0),
    round(c.projected_prize_pool_cents::numeric * coalesce(c.team_allocation_basis_points, 0)::numeric / 10000)::integer,
    round(c.projected_prize_pool_cents::numeric * coalesce(c.individual_allocation_basis_points, 0)::numeric / 10000)::integer,
    c.version,
    c.created_at,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'pool', sppt.pool,
          'place', sppt.place,
          'label', sppt.label,
          'allocationBasisPoints', sppt.allocation_basis_points,
          'amountCents', round(
            (
              case sppt.pool
                when 'team' then c.projected_prize_pool_cents::numeric
                  * coalesce(c.team_allocation_basis_points, 0)::numeric / 10000
                else c.projected_prize_pool_cents::numeric
                  * coalesce(c.individual_allocation_basis_points, 0)::numeric / 10000
              end
            ) * sppt.allocation_basis_points::numeric / 10000
          )::integer
        )
        order by sppt.pool, sppt.place
      )
      from public.season_prize_payout_templates sppt
      where sppt.configuration_id = c.configuration_id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'pool', sfpp.pool,
          'place', sfpp.place,
          'label', sfpp.label,
          'amountCents', sfpp.amount_cents,
          'finalizedAt', sfpp.finalized_at
        )
        order by sfpp.pool, sfpp.place
      )
      from public.season_final_prize_payouts sfpp
      where sfpp.season_id = c.id
    ), '[]'::jsonb)
  from computed c;
$$;

revoke all on function public.configure_season_prizes(uuid, uuid, integer, integer, integer, integer, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.configure_season_prizes(uuid, uuid, integer, integer, integer, integer, integer, jsonb)
  to service_role;

revoke all on function public.finalize_season_prize_payouts(uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.finalize_season_prize_payouts(uuid, uuid, jsonb)
  to service_role;

revoke all on function public.get_season_prize_summary(uuid)
  from public, anon, authenticated;
grant execute on function public.get_season_prize_summary(uuid)
  to service_role;

comment on table public.season_prize_configurations is
  'Versioned public season prize configuration. Trusted admin commands append versions instead of mutating history.';

comment on table public.season_prize_payout_templates is
  'Public projected payout percentages for a prize configuration.';

comment on table public.season_final_prize_payouts is
  'Public immutable finalized prize payout amounts. Payment status remains private.';

comment on function public.configure_season_prizes(uuid, uuid, integer, integer, integer, integer, integer, jsonb) is
  'Service-role-only admin boundary for appending a season prize configuration and projected payout template.';

comment on function public.finalize_season_prize_payouts(uuid, uuid, jsonb) is
  'Service-role-only admin boundary for writing immutable finalized season prize payouts.';

comment on function public.get_season_prize_summary(uuid) is
  'Service-role-only public read model for aggregate season purse data without per-player payment status.';
