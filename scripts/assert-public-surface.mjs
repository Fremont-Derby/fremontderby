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

/**
 * Resolve which hosts a canary run should probe.
 * Prefer CANARY_HOSTS_JSON; else CANARY_ONLY name filter; else full CANARY_HOSTS.
 */
export function resolveCanaryHosts(env = process.env) {
  const raw = env.CANARY_HOSTS_JSON;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* fall through */
    }
  }
  // Optional: CANARY_ONLY=production,www
  const only = String(env.CANARY_ONLY || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (only.length) {
    return CANARY_HOSTS.filter((h) => only.includes(h.name));
  }
  return [...CANARY_HOSTS];
}

function envHosts() {
  return resolveCanaryHosts(process.env);
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
  const failures = [];
  const results = [];

  for (const host of hosts) {
    for (const path of PUBLIC_JSON_PATHS) {
      const result = await probeJson(host.base, path, host.expectEnv, fetchImpl);
      results.push({ host: host.name, path, ...result });
      if (!result.ok) failures.push({ host: host.name, path, ...result });
    }
    for (const path of PUBLIC_HTML_PATHS) {
      const result = await probeHtml(host.base, path, fetchImpl);
      results.push({ host: host.name, path, ...result });
      if (!result.ok) failures.push({ host: host.name, path, ...result });
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    results,
    hosts: hosts.map((h) => h.name),
  };
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  try {
    const result = await assertPublicSurface();
    for (const row of result.results || []) {
      const mark = row.ok ? 'OK' : 'FAIL';
      console.log(`${mark} ${row.host} ${row.path} ${row.status ?? ''} ${row.error || ''}`.trim());
    }
    if (!result.ok) {
      console.error(JSON.stringify(result.failures, null, 2));
      process.exitCode = 1;
    } else {
      console.log('public surface OK', result.hosts.join(', '));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
