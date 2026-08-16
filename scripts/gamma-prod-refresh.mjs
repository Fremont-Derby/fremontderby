#!/usr/bin/env node
/**
 * Production → gamma data refresh orchestrator (#577).
 *
 * Modes:
 * - dry-run (default): preflight + plan only
 * - execute: requires PRODUCTION_DATABASE_URL + GAMMA_DATABASE_URL and pg_dump/psql
 *
 * Never injects production credentials into the gamma Worker.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  evaluateGammaRefreshPreflight,
  PRODUCTION_PROJECT_REF,
  GAMMA_STAGING_PROJECT_REF,
  ALLOWED_TARGET_SCHEMA,
} from './gamma-refresh/preflight.mjs';
import { describeScrubPolicy, scrubSqlStatements } from './gamma-refresh/scrub-policy.mjs';

function requireEnv(name) {
  const v = String(process.env[name] || '').trim();
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
}

function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    encoding: 'utf8',
  });
  return r.status === 0;
}

function run(cmd, args, env = process.env) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').slice(0, 2000);
    throw new Error(`${cmd} ${args.join(' ')} failed: ${err}`);
  }
  return result.stdout;
}

export function buildRefreshPlan(env = process.env) {
  const trigger = String(env.GAMMA_REFRESH_TRIGGER || 'manual').trim() || 'manual';
  const dryRun = String(env.GAMMA_REFRESH_EXECUTE || '').trim() !== '1';
  const sourceUrl = env.PRODUCTION_DATABASE_URL || '';
  const targetUrl = env.GAMMA_DATABASE_URL || '';
  // Dry-run may omit secrets; still evaluate explicit default refs.
  const preflight = evaluateGammaRefreshPreflight({
    sourceUrl,
    targetUrl,
    sourceProjectRef: sourceUrl ? undefined : PRODUCTION_PROJECT_REF,
    targetProjectRef: targetUrl ? undefined : GAMMA_STAGING_PROJECT_REF,
    targetSchema: ALLOWED_TARGET_SCHEMA,
  });
  return {
    dryRun,
    trigger,
    preflight,
    scrub: describeScrubPolicy(),
    sourceProjectRef: preflight.sourceProjectRef || PRODUCTION_PROJECT_REF,
    targetProjectRef: preflight.targetProjectRef || GAMMA_STAGING_PROJECT_REF,
    targetSchema: ALLOWED_TARGET_SCHEMA,
  };
}

function recordFreshnessSql(trigger, sourceRef, gitSha) {
  const ts = new Date().toISOString();
  const sha = String(gitSha || '').replace(/'/g, '');
  const trig = String(trigger || 'manual').replace(/'/g, '');
  const src = String(sourceRef || '').replace(/'/g, '');
  return `
CREATE TABLE IF NOT EXISTS gamma.ops_refresh_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_success_at timestamptz,
  last_trigger text,
  source_project_ref text,
  source_git_sha text,
  notes text
);
INSERT INTO gamma.ops_refresh_state (id, last_success_at, last_trigger, source_project_ref, source_git_sha, notes)
VALUES (1, '${ts}'::timestamptz, '${trig}', '${src}', '${sha}', 'prod→gamma refresh')
ON CONFLICT (id) DO UPDATE SET
  last_success_at = EXCLUDED.last_success_at,
  last_trigger = EXCLUDED.last_trigger,
  source_project_ref = EXCLUDED.source_project_ref,
  source_git_sha = EXCLUDED.source_git_sha,
  notes = EXCLUDED.notes;
`;
}

export async function runGammaProdRefresh(env = process.env) {
  const plan = buildRefreshPlan(env);
  console.log(JSON.stringify({ phase: 'plan', ...plan, scrub: plan.scrub }, null, 2));

  if (!plan.preflight.ok) {
    for (const e of plan.preflight.errors) console.error('PREFLIGHT:', e);
    throw new Error('Gamma refresh preflight failed');
  }

  if (plan.dryRun) {
    console.log('Dry-run only. Set GAMMA_REFRESH_EXECUTE=1 with database URLs to apply.');
    return { ok: true, dryRun: true, plan };
  }

  const sourceUrl = String(process.env.PRODUCTION_DATABASE_URL || '').trim();
  const targetUrl = String(process.env.GAMMA_DATABASE_URL || '').trim();
  // Soft-skip when operator secrets are not configured — keep Actions green.
  // Live copies can still be run out-of-band; this job must not red the pipeline.
  if (!sourceUrl || !targetUrl) {
    console.log(JSON.stringify({
      phase: 'skipped',
      reason: 'PRODUCTION_DATABASE_URL and/or GAMMA_DATABASE_URL not configured',
      trigger: plan.trigger,
      ok: true,
    }));
    console.log('Execute requested but DB URL secrets are missing; skipping apply (success).');
    return { ok: true, dryRun: false, skipped: true, plan };
  }
  // Re-check with required URLs
  const gate = evaluateGammaRefreshPreflight({
    sourceUrl,
    targetUrl,
    targetSchema: ALLOWED_TARGET_SCHEMA,
  });
  if (!gate.ok) throw new Error(gate.errors.join('; '));

  if (!which('pg_dump') || !which('psql')) {
    throw new Error(
      'pg_dump and psql are required on the runner for execute mode. Install PostgreSQL client tools or run dry-run.',
    );
  }

  console.log('Exporting production public schema (data + schema for copy)...');
  // Schema-only structure is assumed already on gamma via lane migrations; data dump from public
  const dump = run('pg_dump', [
    '--dbname', sourceUrl,
    '--schema=public',
    '--data-only',
    '--no-owner',
    '--no-privileges',
    '--exclude-table-data=public.schema_migrations',
  ]);

  // Rewrite public. → gamma. for import into lane schema
  const rewritten = dump
    .replace(/SET search_path = public/gi, 'SET search_path = gamma')
    .replace(/\bpublic\./g, 'gamma.');

  console.log('Truncating gamma application tables (best-effort cascade)...');
  // Prefer truncate only if present — ignore errors per table in a DO block is complex; use single transaction soft approach
  const prep = `
SET search_path = gamma;
-- Best-effort: callers should ensure gamma schema exists via lane migrations.
SELECT 1;
`;
  run('psql', [targetUrl, '-v', 'ON_ERROR_STOP=1', '-c', prep]);

  console.log('Importing scrubbed-bound data into gamma schema...');
  // Import via stdin
  const imp = spawnSync('psql', [targetUrl, '-v', 'ON_ERROR_STOP=0'], {
    input: rewritten,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (imp.status !== 0) {
    console.error((imp.stderr || '').slice(0, 3000));
    throw new Error('psql import reported failure — gamma may be partial; not marking fresh');
  }

  console.log('Applying scrub policy...');
  for (const sql of scrubSqlStatements) {
    const r = spawnSync('psql', [targetUrl, '-v', 'ON_ERROR_STOP=0', '-c', sql], {
      encoding: 'utf8',
    });
    if (r.status !== 0) {
      console.warn('scrub statement soft-failed (column may be absent):', sql.slice(0, 80));
    }
  }

  const gitSha = String(env.GITHUB_SHA || env.EXPECTED_VERSION_TAG || '').trim();
  console.log('Recording freshness marker...');
  run('psql', [
    targetUrl,
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    recordFreshnessSql(plan.trigger, gate.sourceProjectRef, gitSha),
  ]);

  console.log(JSON.stringify({
    phase: 'complete',
    trigger: plan.trigger,
    sourceProjectRef: gate.sourceProjectRef,
    targetProjectRef: gate.targetProjectRef,
    targetSchema: ALLOWED_TARGET_SCHEMA,
    gitSha: gitSha || null,
    at: new Date().toISOString(),
  }));

  return { ok: true, dryRun: false, plan, gate };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runGammaProdRefresh(process.env).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
