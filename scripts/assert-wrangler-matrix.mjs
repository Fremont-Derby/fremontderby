#!/usr/bin/env node
/**
 * CI guardrail (#1194): fail when wrangler.jsonc drifts from the authoritative
 * docs/deployment-matrix.json (domain / Worker / ENVIRONMENT / Supabase project /
 * schema / workers_dev / preview_urls).
 *
 * No network, no secrets — safe on every PR.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PRODUCTION_REF = 'cpiucsxlkicmlbvdvhww';
export const STAGING_REF = 'oqkkvqkerusepyokzbmt';

export function stripJsonc(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

export function parseWrangler(text) {
  return JSON.parse(stripJsonc(text));
}

export function projectRefFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const host = new URL(url.trim()).hostname;
    const [ref, service, tld] = host.split('.');
    if (service !== 'supabase' || tld !== 'co') return null;
    return ref || null;
  } catch {
    return null;
  }
}

export function collectProfiles(config) {
  const profiles = [
    {
      name: 'production',
      env: config.vars?.ENVIRONMENT || 'production',
      worker: config.name,
      vars: config.vars || {},
      routes: config.routes || [],
      workersDev: config.workers_dev,
      previewUrls: config.preview_urls,
      isRoot: true,
    },
  ];
  for (const [key, block] of Object.entries(config.env || {})) {
    profiles.push({
      name: key,
      env: block.vars?.ENVIRONMENT || key,
      worker: block.name || config.name,
      vars: block.vars || {},
      routes: block.routes || [],
      workersDev: block.workers_dev ?? config.workers_dev,
      previewUrls: block.preview_urls ?? config.preview_urls,
      isRoot: false,
    });
  }
  return profiles;
}

function routePatterns(routes) {
  return (routes || [])
    .filter((route) => route && route.custom_domain === true && route.pattern)
    .map((route) => route.pattern);
}

function profileForMatrixLane(profiles, laneKey, expected) {
  // Prefer named env block; fall back to root when ENVIRONMENT matches.
  const byName = profiles.find((p) => p.name === laneKey);
  if (byName) return byName;
  return profiles.find((p) => p.env === expected.environment);
}

export function assertWranglerMatrix(config, matrix) {
  const failures = [];
  const profiles = collectProfiles(config);
  const domainOwners = new Map();

  for (const profile of profiles) {
    if (profile.workersDev === true) {
      failures.push(`${profile.name}: workers_dev must be false`);
    }
    if (profile.previewUrls === true) {
      failures.push(`${profile.name}: preview_urls must be false`);
    }

    const url = profile.vars.SUPABASE_URL || '';
    const urlRef = projectRefFromUrl(url);
    const expectedRef = String(profile.vars.EXPECTED_SUPABASE_PROJECT_REF || '').trim();
    const env = String(profile.env || '').trim();

    if (env && env !== 'production' && env !== 'staging') {
      if (url.includes(PRODUCTION_REF) || expectedRef === PRODUCTION_REF || urlRef === PRODUCTION_REF) {
        failures.push(`${profile.name}: non-prod profile points at production Supabase`);
      }
    }
    if (env === 'production') {
      if (url.includes(STAGING_REF) || expectedRef === STAGING_REF || urlRef === STAGING_REF) {
        failures.push(`${profile.name}: production profile points at non-prod Supabase`);
      }
    }
    if (urlRef && expectedRef && urlRef !== expectedRef) {
      failures.push(
        `${profile.name}: SUPABASE_URL ref ${urlRef} disagrees with EXPECTED_SUPABASE_PROJECT_REF ${expectedRef}`,
      );
    }

    for (const pattern of routePatterns(profile.routes)) {
      if (domainOwners.has(pattern) && domainOwners.get(pattern) !== profile.name) {
        failures.push(
          `domain ${pattern} attached to both ${domainOwners.get(pattern)} and ${profile.name}`,
        );
      } else {
        domainOwners.set(pattern, profile.name);
      }
    }
  }

  for (const [laneKey, expected] of Object.entries(matrix || {})) {
    const profile = profileForMatrixLane(profiles, laneKey, expected);
    if (!profile) {
      failures.push(`matrix lane ${laneKey}: missing wrangler profile`);
      continue;
    }

    if (profile.env !== expected.environment) {
      failures.push(
        `${profile.name}: ENVIRONMENT ${profile.env} != matrix ${expected.environment}`,
      );
    }
    if (profile.worker !== expected.worker) {
      failures.push(`${profile.name}: worker ${profile.worker} != ${expected.worker}`);
    }

    const expectedRef = String(profile.vars.EXPECTED_SUPABASE_PROJECT_REF || '').trim();
    const urlRef = projectRefFromUrl(profile.vars.SUPABASE_URL || '');
    if (expectedRef !== expected.projectRef) {
      failures.push(
        `${profile.name}: project ref ${expectedRef || '(missing)'} != ${expected.projectRef}`,
      );
    }
    if (urlRef && urlRef !== expected.projectRef) {
      failures.push(`${profile.name}: SUPABASE_URL ref ${urlRef} != ${expected.projectRef}`);
    }

    const schema = String(profile.vars.SUPABASE_SCHEMA || '').trim();
    if (expected.schema === 'public') {
      if (schema && schema !== 'public') {
        failures.push(`${profile.name}: schema ${schema} != public`);
      }
    } else if (schema !== expected.schema) {
      failures.push(
        `${profile.name}: schema ${schema || '(missing)'} != ${expected.schema}`,
      );
    }

    if (expected.workers_dev === false && profile.workersDev !== false) {
      failures.push(`${profile.name}: workers_dev must be false`);
    }
    if (expected.preview_urls === false && profile.previewUrls !== false) {
      failures.push(`${profile.name}: preview_urls must be false`);
    }

    const patterns = routePatterns(profile.routes);
    const requiredDomains = [expected.domain, ...(expected.extraDomains || [])];
    for (const domain of requiredDomains) {
      if (!patterns.includes(domain)) {
        failures.push(`${profile.name}: missing custom_domain route for ${domain}`);
      }
    }
  }

  // Two matrix lanes must not share the same Worker name.
  const workerToLane = new Map();
  for (const [laneKey, expected] of Object.entries(matrix || {})) {
    if (workerToLane.has(expected.worker) && workerToLane.get(expected.worker) !== laneKey) {
      failures.push(
        `worker ${expected.worker} claimed by both ${workerToLane.get(expected.worker)} and ${laneKey}`,
      );
    } else {
      workerToLane.set(expected.worker, laneKey);
    }
  }

  return failures;
}

export function loadRepoMatrixAndConfig(root = join(dirname(fileURLToPath(import.meta.url)), '..')) {
  const matrix = JSON.parse(readFileSync(join(root, 'docs/deployment-matrix.json'), 'utf8'));
  const config = parseWrangler(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  return { matrix, config, root };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const { matrix, config } = loadRepoMatrixAndConfig();
  const failures = assertWranglerMatrix(config, matrix);
  if (failures.length) {
    console.error('wrangler matrix drift (#1194):');
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log('wrangler matrix ok');
}
