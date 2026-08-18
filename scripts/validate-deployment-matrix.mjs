#!/usr/bin/env node
/**
 * Static deployment-matrix guardrail (#1194).
 * Parses wrangler.jsonc and fails if any lane drifts from
 * config/deployment-matrix.json (project ref, schema, routes,
 * workers_dev, preview_urls, environment name).
 *
 * No network, no secrets. Safe for every PR.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadJsonc(path) {
  const raw = readFileSync(path, 'utf8');
  // Strip // and /* */ comments while preserving strings.
  let out = '';
  let i = 0;
  let inString = false;
  let quote = null;
  while (i < raw.length) {
    const c = raw[i];
    const next = raw[i + 1];
    if (inString) {
      out += c;
      if (c === '\\' && i + 1 < raw.length) {
        out += raw[i + 1];
        i += 2;
        continue;
      }
      if (c === quote) inString = false;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === '/' && next === '/') {
      i += 2;
      while (i < raw.length && raw[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i + 1 < raw.length && !(raw[i] === '*' && raw[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return JSON.parse(out);
}

export function validateDeploymentMatrix({
  wranglerPath = resolve(root, 'wrangler.jsonc'),
  matrixPath = resolve(root, 'config/deployment-matrix.json'),
  wrangler = null,
  matrix = null,
} = {}) {
  const errors = [];
  const w = wrangler ?? loadJsonc(wranglerPath);
  const m = matrix ?? JSON.parse(readFileSync(matrixPath, 'utf8'));

  const prodLane = m.lanes.production;
  const nonProdRefs = new Set(
    Object.values(m.lanes)
      .filter((l) => l.environment !== 'production')
      .map((l) => l.supabaseProjectRef),
  );

  // Root / production profile
  if (w.name !== prodLane.worker) {
    errors.push(`production worker name: expected "${prodLane.worker}", got "${w.name}"`);
  }
  if (w.vars?.ENVIRONMENT !== prodLane.environment) {
    errors.push(`production ENVIRONMENT: expected "${prodLane.environment}", got "${w.vars?.ENVIRONMENT}"`);
  }
  if (w.vars?.EXPECTED_SUPABASE_PROJECT_REF !== prodLane.supabaseProjectRef) {
    errors.push(
      `production EXPECTED_SUPABASE_PROJECT_REF: expected "${prodLane.supabaseProjectRef}", got "${w.vars?.EXPECTED_SUPABASE_PROJECT_REF}"`,
    );
  }
  if (w.workers_dev !== false) {
    errors.push(`production workers_dev must be false (got ${w.workers_dev})`);
  }
  if (w.preview_urls !== false) {
    errors.push(`production preview_urls must be false (got ${w.preview_urls})`);
  }
  const rootRoutes = (w.routes || []).map((r) => r.pattern);
  for (const d of [prodLane.domain, ...(prodLane.extraDomains || [])]) {
    if (!rootRoutes.includes(d)) {
      errors.push(`production missing route for ${d}`);
    }
  }
  if (nonProdRefs.has(w.vars?.EXPECTED_SUPABASE_PROJECT_REF) && w.vars?.ENVIRONMENT === 'production') {
    // already covered by exact ref check; keep explicit for clarity
  }
  if (w.vars?.EXPECTED_SUPABASE_PROJECT_REF && nonProdRefs.has(w.vars.EXPECTED_SUPABASE_PROJECT_REF) && prodLane.supabaseProjectRef !== w.vars.EXPECTED_SUPABASE_PROJECT_REF) {
    errors.push(`production must not use a non-prod Supabase project ref`);
  }

  // Nested env blocks
  for (const [laneKey, lane] of Object.entries(m.lanes)) {
    if (!lane.wranglerEnvKey) continue;
    const env = w.env?.[lane.wranglerEnvKey];
    if (!env) {
      errors.push(`missing wrangler env block for lane "${laneKey}" (key "${lane.wranglerEnvKey}")`);
      continue;
    }
    if (env.name !== lane.worker) {
      errors.push(`${laneKey} worker name: expected "${lane.worker}", got "${env.name}"`);
    }
    if (env.vars?.ENVIRONMENT !== lane.environment) {
      errors.push(`${laneKey} ENVIRONMENT: expected "${lane.environment}", got "${env.vars?.ENVIRONMENT}"`);
    }
    if (env.vars?.EXPECTED_SUPABASE_PROJECT_REF !== lane.supabaseProjectRef) {
      errors.push(
        `${laneKey} EXPECTED_SUPABASE_PROJECT_REF: expected "${lane.supabaseProjectRef}", got "${env.vars?.EXPECTED_SUPABASE_PROJECT_REF}"`,
      );
    }
    if (lane.schema && env.vars?.SUPABASE_SCHEMA !== lane.schema) {
      errors.push(`${laneKey} SUPABASE_SCHEMA: expected "${lane.schema}", got "${env.vars?.SUPABASE_SCHEMA}"`);
    }
    if (env.workers_dev !== false) {
      errors.push(`${laneKey} workers_dev must be false (got ${env.workers_dev})`);
    }
    if (env.preview_urls !== false) {
      errors.push(`${laneKey} preview_urls must be false (got ${env.preview_urls})`);
    }
    const envRoutes = (env.routes || []).map((r) => r.pattern);
    if (!envRoutes.includes(lane.domain)) {
      errors.push(`${laneKey} missing route for ${lane.domain}`);
    }
    // Non-prod must never point at production project
    if (env.vars?.EXPECTED_SUPABASE_PROJECT_REF === prodLane.supabaseProjectRef) {
      errors.push(`${laneKey} must not use the production Supabase project ref "${prodLane.supabaseProjectRef}"`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  const result = validateDeploymentMatrix();
  if (result.ok) {
    console.log('deployment-matrix: OK');
    process.exit(0);
  }
  console.error('deployment-matrix: FAILED');
  for (const e of result.errors) console.error(`  - ${e}`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-deployment-matrix.mjs')) {
  main();
}
