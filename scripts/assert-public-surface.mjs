#!/usr/bin/env node
/**
 * Live canary: public HTML + JSON surfaces across production and lanes.
 * Predicts breakage when routes move, shells regress, or a lane deploy goes sideways.
 */
import { fileURLToPath } from 'node:url';
import {
  PUBLIC_HTML_PATHS,
  PUBLIC_JSON_PATHS,
  HTML_SHELL_MARKERS,
  CANARY_HOSTS,
} from './public-surface-contract.mjs';

function envHosts() {
  const raw = process.env.CANARY_HOSTS_JSON;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* fall through */
    }
  }
  // Optional: CANARY_ONLY=production,www
  const only = String(process.env.CANARY_ONLY || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (only.length) {
    return CANARY_HOSTS.filter((h) => only.includes(h.name));
  }
  return [...CANARY_HOSTS];
}

export function htmlShellOk(text) {
  const lower = String(text || '').toLowerCase();
  if (!lower.includes('<!doctype html')) return false;
  return HTML_SHELL_MARKERS.every((m) => lower.includes(m.toLowerCase()));
}

export async function probeJson(base, path, expectEnv, fetchImpl = fetch) {
  const url = base.replace(/\/+$/, '') + path;
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'fremontderby-public-surface' },
    redirect: 'follow',
  });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, url, status: response.status, error: 'non-JSON' };
  }
  if (path === '/health') {
    const ok = response.status === 200 && body?.ok === true;
    return { ok, url, status: response.status, error: ok ? null : `health not ok` };
  }
  if (path === '/health/environment') {
    // Lanes may 503 when readiness fails; still require matching environment label when present
    const env = body?.environment;
    const envOk = !expectEnv || env === expectEnv;
    const ok = envOk && typeof env === 'string';
    return {
      ok,
      url,
      status: response.status,
      environment: env,
      readinessOk: body?.ok === true,
      error: ok ? null : `env="${env}" expected="${expectEnv}"`,
    };
  }
  return { ok: response.status >= 200 && response.status < 400, url, status: response.status };
}

export async function probeHtml(base, path, fetchImpl = fetch) {
  const url = base.replace(/\/+$/, '') + path;
  const attempt = async () => {
    const response = await fetchImpl(url, {
      headers: { Accept: 'text/html', 'User-Agent': 'fremontderby-public-surface' },
      redirect: 'follow',
    });
    const text = await response.text();
    const statusOk = response.status >= 200 && response.status < 400;
    const shellOk = htmlShellOk(text);
    const ok = statusOk && shellOk;
    return {
      ok,
      url,
      status: response.status,
      bytes: text.length,
      error: ok ? null : !statusOk ? `HTTP ${response.status}` : 'html shell markers missing',
    };
  };
  let result = await attempt();
  // One retry: lane deploys can briefly 404 while versions swap
  if (!result.ok && result.status >= 400) {
    await new Promise((r) => setTimeout(r, 1500));
    result = await attempt();
  }
  return result;
}

export async function assertPublicSurface({ hosts = envHosts(), fetchImpl = fetch } = {}) {
  const results = [];
  for (const host of hosts) {
    for (const path of PUBLIC_JSON_PATHS) {
      try {
        results.push({
          host: host.name,
          kind: 'json',
          ...(await probeJson(host.base, path, host.expectEnv, fetchImpl)),
        });
      } catch (error) {
        results.push({
          host: host.name,
          kind: 'json',
          ok: false,
          url: host.base + path,
          error: String(error.message || error),
        });
      }
    }
    for (const path of PUBLIC_HTML_PATHS) {
      try {
        results.push({
          host: host.name,
          kind: 'html',
          ...(await probeHtml(host.base, path, fetchImpl)),
        });
      } catch (error) {
        results.push({
          host: host.name,
          kind: 'html',
          ok: false,
          url: host.base + path,
          error: String(error.message || error),
        });
      }
    }
  }
  // HEAD must match GET status for CDN/monitor probes (empty body).
  try {
    const prod = envHosts().find((h) => h.name === 'production') || { base: 'https://fremontderby.com' };
    const homeUrl = prod.base.replace(/\/+$/, '') + '/';
    const response = await fetch(homeUrl, {
      method: 'HEAD',
      headers: { Accept: 'text/html', 'User-Agent': 'fremontderby-public-surface' },
    });
    const ok = response.status === 200;
    results.push({
      ok,
      host: 'production',
      kind: 'head',
      status: response.status,
      url: homeUrl,
      error: ok ? null : `HEAD / expected 200 got ${response.status}`,
    });
  } catch (error) {
    results.push({
      ok: false,
      host: 'production',
      kind: 'head',
      url: 'https://fremontderby.com/',
      error: String(error.message || error),
    });
  }

  // Baseline browser security headers on production HTML shell.
  try {
    const prod = envHosts().find((h) => h.name === 'production') || { base: 'https://fremontderby.com' };
    const homeUrl = prod.base.replace(/\/+$/, '') + '/';
    const response = await fetch(homeUrl, {
      headers: { Accept: 'text/html', 'User-Agent': 'fremontderby-public-surface' },
    });
    const required = [
      ['content-security-policy', /default-src/i],
      ['x-content-type-options', /nosniff/i],
      ['x-frame-options', /DENY|SAMEORIGIN/i],
      ['referrer-policy', /.+/],
    ];
    const missing = [];
    for (const [name, re] of required) {
      const value = response.headers.get(name) || '';
      if (!re.test(value)) missing.push(name);
    }
    const ok = response.ok && missing.length === 0;
    results.push({
      ok,
      host: 'production',
      kind: 'securityHeaders',
      status: response.status,
      url: homeUrl,
      error: ok ? null : `missing/weak headers: ${missing.join(',') || 'response not ok'}`,
    });
  } catch (error) {
    results.push({
      ok: false,
      host: 'production',
      kind: 'securityHeaders',
      url: 'https://fremontderby.com/',
      error: String(error.message || error),
    });
  }

  // Production deploy identity — versionTag must be present (git stamp, env, or CF version id).
  try {
    const prod = envHosts().find((h) => h.name === 'production') || { base: 'https://fremontderby.com' };
    const healthUrl = prod.base.replace(/\/+$/, '') + '/health';
    const response = await fetch(healthUrl, {
      headers: { Accept: 'application/json', 'User-Agent': 'fremontderby-public-surface' },
    });
    const body = await response.json().catch(() => ({}));
    const tag = body && body.versionTag;
    const ok = response.ok && Boolean(tag);
    results.push({
      ok,
      host: 'production',
      kind: 'versionTag',
      status: response.status,
      url: healthUrl,
      error: ok ? null : `missing versionTag (got ${JSON.stringify(tag)})`,
    });
  } catch (error) {
    results.push({
      ok: false,
      host: 'production',
      kind: 'versionTag',
      url: 'https://fremontderby.com/health',
      error: String(error.message || error),
    });
  }

  const failed = results.filter((r) => !r.ok);
  return { ok: failed.length === 0, results, failed };
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  const summary = await assertPublicSurface();
  for (const row of summary.results) {
    const flag = row.ok ? 'OK' : 'FAIL';
    console.log(flag, row.host, row.kind, row.status ?? '', row.url || '', row.error || '');
  }
  if (!summary.ok) {
    console.error(`Public surface canary failed: ${summary.failed.length}/${summary.results.length}`);
    process.exit(1);
  }
  console.log('Public surface canary passed', {
    hosts: envHosts().map((h) => h.name),
    checks: summary.results.length,
  });
}
