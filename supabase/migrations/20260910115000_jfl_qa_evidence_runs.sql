-- JFL-only central persistence for versioned QA evidence (#2263).
-- Raw envelopes are immutable and retained for 90 days by the follow-up retention job.

create table if not exists jfl_private.qa_evidence_runs (
  run_id text primary key,
  schema_version text not null,
  level_id text not null,
  seed text not null,
  build_sha text not null,
  replay_of_run_id text,
  outcome text not null,
  completed_at timestamptz,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint qa_evidence_run_id_length check (length(run_id) between 1 and 128),
  constraint qa_evidence_schema_version_v1 check (schema_version = '1.0.0'),
  constraint qa_evidence_build_sha_exact check (build_sha ~ '^[0-9a-f]{40}$'),
  constraint qa_evidence_outcome_valid check (outcome in ('pass', 'fail', 'incomplete')),
  constraint qa_evidence_lane_jfl check (payload ->> 'lane' = 'jfl'),
  constraint qa_evidence_payload_identity check (
    payload ->> 'run_id' = run_id
    and payload ->> 'schema_version' = schema_version
    and payload ->> 'level_id' = level_id
    and payload ->> 'seed' = seed
    and payload ->> 'build_sha' = build_sha
    and payload ->> 'outcome' = outcome
  )
);

create index if not exists qa_evidence_runs_build_level_seed_idx
  on jfl_private.qa_evidence_runs (build_sha, level_id, seed, created_at desc);

alter table jfl_private.qa_evidence_runs enable row level security;
alter table jfl_private.qa_evidence_runs force row level security;

revoke all on table jfl_private.qa_evidence_runs from public, anon, authenticated;
grant select, insert on table jfl_private.qa_evidence_runs to service_role;

comment on table jfl_private.qa_evidence_runs is
  'JFL-only immutable QA evidence v1. Raw envelopes: 90 days; note text: 30 days. Never exposed directly to browsers.';
comment on column jfl_private.qa_evidence_runs.payload is
  'Validated QA evidence v1 source envelope. Derived analytics must live separately and reference run_id.';

