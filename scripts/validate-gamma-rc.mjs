#!/usr/bin/env node
/**
 * Gamma release-candidate validation (#581).
 * Probes the live gamma host: environment identity, optional commit tag, public smoke.
 * Does not mutate production. No secrets required for public checks.
 */
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';
import { fileURLToPath } from 'node:url';

export const DEFAULT_GAMMA_BASE_URL = 'https://gamma.fremontderby.com';

export function normalizeBaseUrl(value, fallback = DEFAULT_GAMMA_BASE_URL) {
  return stripTrailingSlashes(String(value || fallback).trim());
}

export async function readJson(url, fetchImpl = fetch) {
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

export async function readText(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: { accept: 'text/html', 'user-agent': 'fremont-gamma-rc-validation' },
    redirect: 'manual',
  });
  const text = await response.text();
  return { response, text };
}

export function versionTagMatches(actual, expected) {
  const a = String(actual || '').trim();
  const e = String(expected || '').trim();
  if (!e) return true;
  if (!a) return false;
  if (a === e) return true;
  if (a.startsWith(e.slice(0, 7))) return true;
  if (e.startsWith(a) || a.startsWith(e)) return true;
  return false;
}

export async function validateGammaRc({
  baseUrl = DEFAULT_GAMMA_BASE_URL,
  expectedVersionTag = '',
  fetchImpl = fetch,
} = {}) {
  const base = normalizeBaseUrl(baseUrl);
  const expectedTag = String(expectedVersionTag || '').trim();
  const errors = [];
  const notes = [];

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

  if (expectedTag && !versionTagMatches(env.versionTag || env.version, expectedTag)) {
    const actual = String(env.versionTag || env.version || '').trim();
    if (!actual) {
      errors.push(`expected version tag ${expectedTag} but gamma reported no versionTag`);
    } else {
      errors.push(`version tag mismatch: gamma has "${actual}", expected "${expectedTag}"`);
    }
  }

  const { response: homeRes, text: home } = await readText(`${base}/`, fetchImpl);
  if (homeRes.status !== 200) errors.push(`GET / HTTP ${homeRes.status}`);
  if (!/fremont|derby|league/i.test(home)) {
    errors.push('home page did not look like Fremont Derby HTML');
  }

  const { response: seasonsRes, body: seasonsBody } = await readJson(`${base}/api/seasons`, fetchImpl);
  if (seasonsRes.status !== 200) {
    errors.push(`/api/seasons HTTP ${seasonsRes.status}`);
  } else {
    notes.push(`seasons=${Array.isArray(seasonsBody.seasons) ? seasonsBody.seasons.length : 0}`);
  }

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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
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
