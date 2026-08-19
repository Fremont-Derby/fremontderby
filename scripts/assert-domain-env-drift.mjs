#!/usr/bin/env node
/**
 * CI guardrail (#1194): detect domain/environment configuration drift before deploy.
 * Pure local checks — no network, no secrets.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';
import { CANARY_HOSTS } from './public-surface-contract.mjs';
import { LANE_HEALTH_CHECKS } from './assert-lane-health.mjs';
import { PRODUCTION_DNS_HOSTS } from './assert-production-dns.mjs';
import {
  LANE_CUSTOM_DOMAINS,
  assertWranglerRoutesCoverDomains,
} from './lane-custom-domains.mjs';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from './diagnose-worker-domains.mjs';

function parseJsonc(text) {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return JSON.parse(stripped);
}

function expectedServiceForEnv(envName) {
  const environment = String(envName || '').trim();
  if (environment === 'production' || !environment) return 'fremontderby';
  return `fremontderby-${environment}`;
}

export function collectDomainEnvDrift({ wranglerConfig } = {}) {
  const errors = [];
  const hostMap = HOST_ENVIRONMENT_EXPECTATIONS;

  for (const host of CANARY_HOSTS) {
    const hostname = host.base.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (hostMap[hostname] !== host.expectEnv) {
      errors.push(`CANARY_HOSTS ${hostname} expectEnv=${host.expectEnv} host-map=${hostMap[hostname]}`);
    }
  }
  for (const hostname of Object.keys(hostMap)) {
    if (!CANARY_HOSTS.some((h) => h.base.includes(hostname))) {
      errors.push(`HOST_ENVIRONMENT_EXPECTATIONS ${hostname} missing from CANARY_HOSTS`);
    }
  }

  for (const check of LANE_HEALTH_CHECKS) {
    if (hostMap[check.host] !== check.expect) {
      errors.push(`LANE_HEALTH_CHECKS ${check.host} expect=${check.expect} host-map=${hostMap[check.host]}`);
    }
  }

  for (const hostname of PRODUCTION_DNS_HOSTS) {
    if (hostMap[hostname] !== 'production') {
      errors.push(`PRODUCTION_DNS_HOSTS includes non-production ${hostname}`);
    }
  }
  for (const [hostname, env] of Object.entries(hostMap)) {
    if (env === 'production' && !PRODUCTION_DNS_HOSTS.includes(hostname)) {
      errors.push(`production host ${hostname} missing from PRODUCTION_DNS_HOSTS`);
    }
  }

  for (const row of LANE_CUSTOM_DOMAINS) {
    if (hostMap[row.hostname] !== row.env) {
      errors.push(`LANE_CUSTOM_DOMAINS ${row.hostname} env=${row.env} host-map=${hostMap[row.hostname]}`);
    }
    const expectedService = expectedServiceForEnv(row.env);
    if (row.service !== expectedService) {
      errors.push(`LANE_CUSTOM_DOMAINS ${row.hostname} service=${row.service} expected=${expectedService}`);
    }
  }

  for (const hostname of Object.keys(hostMap)) {
    if (!EXPECTED_WORKER_DOMAIN_BINDINGS.has(hostname)) {
      errors.push(`EXPECTED_WORKER_DOMAIN_BINDINGS missing ${hostname}`);
    }
  }

  if (wranglerConfig) {
    try {
      assertWranglerRoutesCoverDomains(wranglerConfig);
    } catch (error) {
      errors.push(String(error.message || error));
    }
    if (wranglerConfig.workers_dev !== false) {
      errors.push('wrangler top-level workers_dev must be false');
    }
    if (wranglerConfig.preview_urls !== false) {
      errors.push('wrangler top-level preview_urls must be false');
    }
    for (const lane of ['jfl', 'dru', 'gamma']) {
      const env = wranglerConfig.env?.[lane];
      if (!env) {
        errors.push(`wrangler env.${lane} missing`);
        continue;
      }
      if (env.workers_dev !== false) errors.push(`wrangler env.${lane}.workers_dev must be false`);
      if (env.preview_urls !== false) errors.push(`wrangler env.${lane}.preview_urls must be false`);
      if (env.vars?.ENVIRONMENT !== lane) {
        errors.push(`wrangler env.${lane}.vars.ENVIRONMENT must be ${lane}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function assertDomainEnvDrift(options = {}) {
  const result = collectDomainEnvDrift(options);
  if (!result.ok) {
    const message = `Domain/environment drift detected:\n- ${result.errors.join('\n- ')}`;
    throw new Error(message);
  }
  return result;
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  try {
    const wranglerConfig = parseJsonc(readFileSync('wrangler.jsonc', 'utf8'));
    assertDomainEnvDrift({ wranglerConfig });
    console.log('Domain/environment drift check OK');
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
