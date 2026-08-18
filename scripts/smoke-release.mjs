import { fileURLToPath } from 'node:url';
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';

const defaultAttempts = 30;
const defaultDelayMs = 10_000;
const smokeHeaderName = 'x-fremont-release-smoke';

function normalizeBaseUrl(value) {
  if (!value || typeof value !== 'string') throw new Error('baseUrl is required');
  return stripTrailingSlashes(value.trim());
}

function compactBodyPreview(text, limit = 180) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function requestHeaders(accept, bypassToken) {
  const headers = { accept };
  if (bypassToken) headers[smokeHeaderName] = bypassToken;
  return headers;
}

function isUnbypassedCloudflareChallenge(reason, bypassToken) {
  if (bypassToken) return false;
  return /did not return JSON \(HTTP 403,[^)]*server cloudflare/i.test(reason)
    && /Just a moment/i.test(reason);
}

async function readJson(response, label) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    const details = [
      `HTTP ${response.status}`,
      `content-type ${response.headers.get('content-type') || 'unknown'}`,
    ];
    for (const [name, displayName] of [
      ['server', 'server'],
      ['cf-ray', 'cf-ray'],
      ['location', 'location'],
    ]) {
      const value = response.headers.get(name);
      if (value) details.push(`${displayName} ${value}`);
    }
    const preview = compactBodyPreview(text);
    throw new Error(
      `${label} did not return JSON (${details.join(', ')})${preview ? `; body preview: ${preview}` : ''}`,
    );
  }
  return { response, body };
}

export function assertExpectedDeployment({ health, environment, expectedEnvironment, expectedVersionTag }) {
  if (health.service !== 'fremontderby' || health.ok !== true) {
    throw new Error('Production /health did not identify a healthy Fremont Derby service');
  }
  if (health.versionTag !== expectedVersionTag) {
    return {
      ready: false,
      reason: `Waiting for Worker version tag ${expectedVersionTag}; currently ${health.versionTag ?? 'untagged'}`,
    };
  }
  if (environment.service !== 'fremontderby') {
    throw new Error('Production /health/environment returned the wrong service');
  }
  if (environment.environment !== expectedEnvironment) {
    throw new Error(
      `Production environment mismatch: expected ${expectedEnvironment}, got ${environment.environment ?? 'unknown'}`,
    );
  }
  if (environment.ok !== true) {
    const failures = Array.isArray(environment.checks)
      ? environment.checks.filter((item) => item?.ok !== true).map((item) => item?.name).filter(Boolean)
      : [];
    throw new Error(
      `Production environment readiness failed${failures.length ? `: ${failures.join(', ')}` : ''}`,
    );
  }
  if (environment.versionTag !== expectedVersionTag) {
    throw new Error('Environment health version does not match /health version');
  }
  return { ready: true };
}
