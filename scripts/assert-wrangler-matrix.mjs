#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PRODUCTION_REF = 'cpiucsxlkicmlbvdvhww';
const STAGING_REF = 'oqkkvqkerusepyokzbmt';

export function stripJsonc(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

export function parseWrangler(text) {
  return JSON.parse(stripJsonc(text));
}

export function collectProfiles(config) {
  const profiles = [{ name: 'root', env: config.vars?.ENVIRONMENT, worker: config.name, vars: config.vars || {}, routes: config.routes || [], workersDev: config.workers_dev, previewUrls: config.preview_urls }];
  for (const [key, block] of Object.entries(config.env || {})) {
    profiles.push({
      name: key,
      env: block.vars?.ENVIRONMENT || key,
      worker: block.name || config.name,
      vars: block.vars || {},
      routes: block.routes || [],
      workersDev: block.workers_dev ?? config.workers_dev,
      previewUrls: block.preview_urls ?? config.preview_urls,
    });
  }
  return profiles;
}

export function assertWranglerMatrix(config, matrix) {
  const failures = [];
  const profiles = collectProfiles(config);
  for (const profile of profiles) {
    const env = String(profile.env || '').trim();
    const expected = matrix[env];
    if (profile.workersDev === true) failures.push(`${profile.name}: workers_dev must be false`);
    if (profile.previewUrls === true) failures.push(`${profile.name}: preview_urls must be false`);
    const url = profile.vars.SUPABASE_URL || '';
    const schema = profile.vars.SUPABASE_SCHEMA || '';
    const expectedRef = profile.vars.EXPECTED_SUPABASE_PROJECT_REF || '';
    if (env && env !== 'production' && (url.includes(PRODUCTION_REF) || expectedRef === PRODUCTION_REF)) {
      failures.push(`${profile.name}: non-prod profile points at production Supabase`);
    }
    if (env === 'production' && (url.includes(STAGING_REF) || expectedRef === STAGING_REF)) {
      failures.push(`${profile.name}: production profile points at non-prod Supabase`);
    }
    if (expected) {
      if (profile.worker && profile.worker !== expected.worker) {
        failures.push(`${profile.name}: worker ${profile.worker} != ${expected.worker}`);
      }
      if (schema && schema !== expected.schema) {
        failures.push(`${profile.name}: schema ${schema} != ${expected.schema}`);
      }
      if (expectedRef && expectedRef !== expected.projectRef) {
        failures.push(`${profile.name}: project ref ${expectedRef} != ${expected.projectRef}`);
      }
    }
  }
  return failures;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const matrix = JSON.parse(readFileSync(join(root, 'docs/deployment-matrix.json'), 'utf8'));
  const config = parseWrangler(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  const failures = assertWranglerMatrix(config, matrix);
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log('wrangler matrix ok');
}
