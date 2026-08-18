#!/usr/bin/env node
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';
/**
 * Gamma release-candidate validation (#581).
 * Probes the live gamma host: environment identity, optional commit tag, public smoke.
 * Does not mutate production. No secrets required for public checks.
 */
import { fileURLToPath } from 'node:url';

const defaultBaseUrl = 'https://gamma.fremontderby.com';

function normalizeBaseUrl(value) {
  return stripTrailingSlashes(String(value || defaultBaseUrl).trim());
}

export function isCloudflareChallengeBody(text, status) {
  const sample = String(text || '').slice(0, 400).toLowerCase();
  if (status === 403 || status === 503) {
    if (
      sample.includes('just a moment')
      || sample.includes('cf-browser-verification')
      || sample.includes('cdn-cgi/challenge')
      || sample.includes('attention required')
      || sample.includes('_cf_chl')
    ) {
      return true;
    }
  }
  return sample.includes('just a moment') && sample.includes('<title>');
}

async function readJson(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json', 'user-agent': 'fremont-gamma-rc-validation' },
    redirect: 'manual',
  });
  const text = await response.text();
  if (isCloudflareChallengeBody(text, response.status)) {
    throw new Error(
      `${url} blocked by Cloudflare challenge (HTTP ${response.status}). ` +
        'Bypass bot fight mode for /health* or run validation from an allowlisted network.',
    );
  }
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
  if (isCloudflareChallengeBody(text, response.status)) {
    throw new Error(
      `${url} blocked by Cloudflare challenge (HTTP ${response.status}). ` +
        'Bypass bot fight mode for public smoke paths or run validation from an allowlisted network.',
    );
  }
  return { response, text };
}

export async function validateGammaRc({
  baseUrl = defaultBaseUrl,
  expectedVersionTag = '',
  fetchImpl = fetch,
} = {}) {
  const base = normalizeBaseUrl(baseUrl);
  const expectedTag = String(expectedVersionTag || '').trim();
  const errors = [];
  const notes = [];

  // 1) Environment identity
  const envUrl = `${base}/health/environment`;
  let envRes;
  let env;
  try {
    ({ response: envRes, body: env } = await readJson(envUrl, fetchImpl));
  } catch (error) {
    return {
      ok: false,
      errors: [String(error.message || error)],
      notes,
      environment: null,
      versionTag: null,
      baseUrl: base,
    };
  }
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
    } else if (actual !== expectedTag && !actual.startsWith(expectedTag.slice(0, 7))) {
      // allow full sha or short
      if (!expectedTag.startsWith(actual) && !actual.startsWith(expectedTag)) {
        errors.push(`version tag mismatch: gamma has "${actual}", expected "${expectedTag}"`);
      }
    }
  }

  // 2) Public home
  try {
    const { response: homeRes, text: home } = await readText(`${base}/`, fetchImpl);
    if (homeRes.status !== 200) errors.push(`GET / HTTP ${homeRes.status}`);
    if (!/fremont|derby|league/i.test(home)) {
      errors.push('home page did not look like Fremont Derby HTML');
    }
  } catch (error) {
    errors.push(String(error.message || error));
  }

  // 3) Public seasons API (read-only)
  try {
    const { response: seasonsRes, body: seasonsBody } = await readJson(`${base}/api/seasons`, fetchImpl);
    if (seasonsRes.status !== 200) {
      errors.push(`/api/seasons HTTP ${seasonsRes.status}`);
    } else {
      notes.push(`seasons=${Array.isArray(seasonsBody.seasons) ? seasonsBody.seasons.length : 0}`);
    }
  } catch (error) {
    errors.push(String(error.message || error));
  }

  // 4) Auth isolation: unauthenticated profile should not be a production-style failure only —
  // gamma may be open-auth in current ops; record outcome, do not fail solely on 200.
  try {
    const { response: meRes, body: me } = await readJson(`${base}/api/me/profile`, fetchImpl);
    notes.push(`/api/me/profile → HTTP ${meRes.status}${me?.profile?.display_name ? ` (${me.profile.display_name})` : ''}`);
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
  const baseUrl = process.env.GAMMA_BASE_URL || process.argv[2] || defaultBaseUrl;
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
