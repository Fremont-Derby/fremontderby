#!/usr/bin/env node
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';
/**
 * Gamma release-candidate validation (#581).
 * Probes the live gamma host: environment identity, optional commit tag, public smoke.
 * Does not mutate production. No secrets required for public checks.
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const DEFAULT_GAMMA_BASE_URL = 'https://gamma.fremontderby.com';

export function normalizeGammaBaseUrl(value) {
  return stripTrailingSlashes(String(value || DEFAULT_GAMMA_BASE_URL).trim());
}

export function versionTagMatches(actual, expectedTag) {
  const actualTag = String(actual || '').trim();
  const expected = String(expectedTag || '').trim();
  if (!expected) return true;
  if (!actualTag) return false;
  if (actualTag === expected) return true;
  if (actualTag.startsWith(expected.slice(0, 7))) return true;
  if (expected.startsWith(actualTag) || actualTag.startsWith(expected)) return true;
  return false;
}

async function readJson(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json', 'user-agent': 'fremont-gamma-rc-validation' },
    redirect: 'manual',
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${url} did not return JSON (HTTP ${response.status}): ${text.slice(0, 120)}`);
  }
  return { response, body };
}

async function readText(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: { accept: 'text/html', 'user-agent': 'fremont-gamma-rc-validation' },
    redirect: 'manual',
  });
  const text = await response.text();
  return { response, text };
}

export async function validateGammaRc({
  baseUrl = DEFAULT_GAMMA_BASE_URL,
  expectedVersionTag = '',
  fetchImpl = fetch,
} = {}) {
  const base = normalizeGammaBaseUrl(baseUrl);
  const expectedTag = String(expectedVersionTag || '').trim();
  const errors = [];
  const notes = [];

  // 1) Environment identity
  const envUrl = `${base}/health/environment`;
  const { response: envRes, body: env } = await readJson(envUrl, fetchImpl);
  if (envRes.status !== 200) errors.push(`/health/environment HTTP ${envRes.status}`);
  if (env.environment !== 'gamma') {
    errors.push(`environment is "${env.environment ?? 'unknown'}", expected "gamma"`);
  }
  if (env.ok !== true) {
    const failed = Array.isArray(env.failedChecks) ? env.failedChecks : env.checks?.filter((c) => !c.ok);
    errors.push(`gamma environment not ok: ${JSON.stringify(failed || env)}`);
  }
  if (env.hostMatchesEnvironment === false) {
    errors.push('hostMatchesEnvironment is false');
  }
  notes.push(`gamma env ok=${env.ok} versionTag=${env.versionTag || env.version || 'untagged'}`);

  if (expectedTag) {
    const actual = String(env.versionTag || env.version || '').trim();
    if (!actual) {
      errors.push(`expected version tag ${expectedTag} but gamma reported no versionTag`);
    } else if (!versionTagMatches(actual, expectedTag)) {
      errors.push(`version tag mismatch: gamma has "${actual}", expected "${expectedTag}"`);
    }
  }

  // 2) Public home
  const { response: homeRes, text: home } = await readText(`${base}/`, fetchImpl);
  if (homeRes.status !== 200) errors.push(`GET / HTTP ${homeRes.status}`);
  if (!/fremont|derby|league/i.test(home)) {
    errors.push('home page did not look like Fremont Derby HTML');
  }

  // 3) Public seasons API (read-only)
  const { response: seasonsRes, body: seasonsBody } = await readJson(`${base}/api/seasons`, fetchImpl);
  if (seasonsRes.status !== 200) {
    errors.push(`/api/seasons HTTP ${seasonsRes.status}`);
  } else {
    notes.push(`seasons=${Array.isArray(seasonsBody.seasons) ? seasonsBody.seasons.length : 0}`);
  }

  // 4) Auth isolation: record outcome only — do not fail solely on 200.
  try {
    const { response: meRes, body: me } = await readJson(`${base}/api/me/profile`, fetchImpl);
    notes.push(
      `/api/me/profile → HTTP ${meRes.status}${me?.profile?.display_name ? ` (${me.profile.display_name})` : ''}`,
    );
  } catch (e) {
    notes.push(`/api/me/profile probe: ${e.message}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    notes,
    environment: env.environment,
    versionTag: env.versionTag || env.version || null,
    baseUrl: base,
  };
}

const isDirect =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirect) {
  const baseUrl = process.env.GAMMA_BASE_URL || process.argv[2] || DEFAULT_GAMMA_BASE_URL;
  const expectedVersionTag = process.env.EXPECTED_VERSION_TAG || process.argv[3] || '';
  const result = await validateGammaRc({ baseUrl, expectedVersionTag });
  for (const n of result.notes) console.log(n);
  if (!result.ok) {
    for (const e of result.errors) console.error('FAIL:', e);
    process.exitCode = 1;
  } else {
    console.log(`Gamma RC validation OK (${result.baseUrl}) tag=${result.versionTag}`);
  }
}
