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
