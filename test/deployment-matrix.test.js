import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDeploymentMatrix } from '../scripts/validate-deployment-matrix.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const matrix = JSON.parse(readFileSync(resolve(root, 'config/deployment-matrix.json'), 'utf8'));

function baseWrangler() {
  return {
    name: 'fremontderby',
    workers_dev: false,
    preview_urls: false,
    routes: [
      { pattern: 'fremontderby.com', custom_domain: true },
      { pattern: 'www.fremontderby.com', custom_domain: true },
    ],
    vars: {
      ENVIRONMENT: 'production',
      EXPECTED_SUPABASE_PROJECT_REF: 'cpiucsxlkicmlbvdvhww',
    },
    env: {
      jfl: {
        name: 'fremontderby-jfl',
        workers_dev: false,
        preview_urls: false,
        routes: [{ pattern: 'jfl.fremontderby.com', custom_domain: true }],
        vars: {
          ENVIRONMENT: 'jfl',
          SUPABASE_SCHEMA: 'jfl',
          EXPECTED_SUPABASE_PROJECT_REF: 'oqkkvqkerusepyokzbmt',
        },
      },
      dru: {
        name: 'fremontderby-dru',
        workers_dev: false,
        preview_urls: false,
        routes: [{ pattern: 'dru.fremontderby.com', custom_domain: true }],
        vars: {
          ENVIRONMENT: 'dru',
          SUPABASE_SCHEMA: 'dru',
          EXPECTED_SUPABASE_PROJECT_REF: 'oqkkvqkerusepyokzbmt',
        },
      },
      gamma: {
        name: 'fremontderby-gamma',
        workers_dev: false,
        preview_urls: false,
        routes: [{ pattern: 'gamma.fremontderby.com', custom_domain: true }],
        vars: {
          ENVIRONMENT: 'gamma',
          SUPABASE_SCHEMA: 'gamma',
          EXPECTED_SUPABASE_PROJECT_REF: 'oqkkvqkerusepyokzbmt',
        },
      },
    },
  };
}

describe('deployment-matrix guardrail (#1194)', () => {
  it('passes the current repository matrix contract shape', () => {
    assert.equal(matrix.version, 1);
    assert.ok(matrix.lanes.production);
    assert.ok(matrix.lanes.jfl);
    assert.ok(matrix.lanes.dru);
    assert.ok(matrix.lanes.gamma);
  });

  it('accepts a correct wrangler profile', () => {
    const result = validateDeploymentMatrix({ wrangler: baseWrangler(), matrix });
    assert.equal(result.ok, true, result.errors.join('; '));
  });

  it('fails when a non-prod lane points at the production Supabase project', () => {
    const w = baseWrangler();
    w.env.dru.vars.EXPECTED_SUPABASE_PROJECT_REF = 'cpiucsxlkicmlbvdvhww';
    const result = validateDeploymentMatrix({ wrangler: w, matrix });
    assert.equal(result.ok, false);
    assert.ok(
      result.errors.some((e) => e.includes('dru') && e.includes('production Supabase')),
      result.errors.join('; '),
    );
  });

  it('fails when JFL points at the production Supabase project', () => {
    const w = baseWrangler();
    w.env.jfl.vars.EXPECTED_SUPABASE_PROJECT_REF = 'cpiucsxlkicmlbvdvhww';
    const result = validateDeploymentMatrix({ wrangler: w, matrix });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('jfl') && e.includes('production Supabase')));
  });

  it('fails when production points at the non-prod Supabase project', () => {
    const w = baseWrangler();
    w.vars.EXPECTED_SUPABASE_PROJECT_REF = 'oqkkvqkerusepyokzbmt';
    const result = validateDeploymentMatrix({ wrangler: w, matrix });
    assert.equal(result.ok, false);
  });

  it('fails when workers_dev is enabled on a lane', () => {
    const w = baseWrangler();
    w.env.gamma.workers_dev = true;
    const result = validateDeploymentMatrix({ wrangler: w, matrix });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('gamma') && e.includes('workers_dev')));
  });

  it('fails when a lane is missing its domain route', () => {
    const w = baseWrangler();
    w.env.dru.routes = [];
    const result = validateDeploymentMatrix({ wrangler: w, matrix });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('dru') && e.includes('missing route')));
  });

  it('fails when ENVIRONMENT name drifts', () => {
    const w = baseWrangler();
    w.env.jfl.vars.ENVIRONMENT = 'production';
    const result = validateDeploymentMatrix({ wrangler: w, matrix });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('jfl') && e.includes('ENVIRONMENT')));
  });
});
