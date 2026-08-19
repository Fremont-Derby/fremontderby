/**
 * Deterministic hourly live probes — no LLM.
 * Used by Cloudflare Cron Triggers and optionally mirrored by GitHub Actions.
 */

export const DEFAULT_PROBE_HOSTS = [
  'https://fremontderby.com',
];

export const DEFAULT_PROBE_PATHS = [
  '/',
  '/schedule',
  '/teams',
  '/playoffs',
  '/trades',
  '/prizes',
  '/admin/audit',
  '/notifications',
];

export const DEFAULT_PROBE_GITHUB_REPO = 'Fremont-Derby/fremontderby';
export const DEFAULT_PROBE_ISSUE = '806';

/**
 * @param {string} baseUrl
 * @param {string[]} paths
 * @param {{ fetch?: typeof fetch, timeoutMs?: number }} [opts]
 */
export async function probeHost(baseUrl, paths = DEFAULT_PROBE_PATHS, opts = {}) {
  const fetchImpl = opts.fetch || globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? 12_000;
  const origin = baseUrl.replace(/\/$/, '');
  const results = [];

  for (const path of paths) {
    const url = `${origin}${path.startsWith('/') ? path : `/${path}`}`;
    const started = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetchImpl(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'fremontderby-hourly-probe/1.0' },
      });
      clearTimeout(timer);
      results.push({
        url,
        status: response.status,
        ok: response.status >= 200 && response.status < 400,
        ms: Date.now() - started,
      });
    } catch (error) {
      results.push({
        url,
        status: 0,
        ok: false,
        ms: Date.now() - started,
        error: error?.name === 'AbortError' ? 'timeout' : (error?.message || 'fetch failed'),
      });
    }
  }

  return {
    host: origin,
    checkedAt: new Date().toISOString(),
    results,
    failures: results.filter((row) => !row.ok),
  };
}

export async function runHourlyProbes(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const hosts = String(env?.HOURLY_PROBE_HOSTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const list = hosts.length ? hosts : DEFAULT_PROBE_HOSTS;
  const reports = [];
  for (const host of list) {
    reports.push(await probeHost(host, DEFAULT_PROBE_PATHS, { fetch: fetchImpl }));
  }
  const failures = reports.flatMap((r) => r.failures.map((f) => ({ host: r.host, ...f })));
  return {
    ok: failures.length === 0,
    checkedAt: new Date().toISOString(),
    reports,
    failures,
  };
}

export function formatProbeMarkdown(summary) {
  const lines = [
    `### Hourly live probe \`${summary.checkedAt}\``,
    '',
    summary.ok ? 'All probed routes returned 2xx/3xx.' : `**${summary.failures.length} failure(s)**`,
    '',
  ];
  for (const report of summary.reports) {
    lines.push(`**${report.host}**`);
    for (const row of report.results) {
      const mark = row.ok ? 'ok' : 'FAIL';
      lines.push(`- \`${mark}\` ${row.url} → ${row.status || row.error} (${row.ms}ms)`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Optional: comment on a tracking issue when probes fail (needs HOURLY_PROBE_GITHUB_TOKEN). */
export async function maybeCommentProbeFailures(env, summary, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (summary.ok) return { commented: false, reason: 'all_ok' };
  const token = String(env?.HOURLY_PROBE_GITHUB_TOKEN || env?.GITHUB_TOKEN || '').trim();
  const issue = String(env?.HOURLY_PROBE_ISSUE || DEFAULT_PROBE_ISSUE).trim();
  const repo = String(env?.HOURLY_PROBE_GITHUB_REPO || DEFAULT_PROBE_GITHUB_REPO).trim();
  if (!token) return { commented: false, reason: 'no_token' };

  const body = formatProbeMarkdown(summary) + '\n\n_Posted by Cloudflare hourly probe (no LLM)._\n';
  const response = await fetchImpl(
    `https://api.github.com/repos/${repo}/issues/${encodeURIComponent(issue)}/comments`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
        'user-agent': 'fremontderby-hourly-probe',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ body }),
    },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { commented: false, reason: `github_${response.status}`, detail: text.slice(0, 200) };
  }
  return { commented: true, repo, issue };
}
