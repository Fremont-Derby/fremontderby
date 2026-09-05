import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const host = '127.0.0.1';
const port = 8787;
const baseUrl = `http://${host}:${port}`;
const serverTimeoutMs = 25_000;
const overallTimeoutMs = 4 * 60_000;

const ignoredCodes = new Set([
  'color-contrast',
  'aria-prohibited-attr',
  'aria-valid-attr-value',
]);

const scans = [
  { name: 'home desktop', path: '/', viewport: { width: 1280, height: 900 } },
  { name: 'home phone', path: '/', viewport: { width: 320, height: 800 } },
  { name: 'standings truthful loading/recovery', path: '/standings', viewport: { width: 320, height: 800 }, wait: 250 },
];

function installPa11y() {
  const result = spawnSync('npm', ['install', '--no-save', '--no-fund', '--no-audit', 'pa11y@9.0.1'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) throw new Error(`npm install pa11y@9.0.1 failed (${result.status})`);
}

async function waitForServer() {
  const deadline = Date.now() + serverTimeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: 'manual' });
      if (response.status > 0 && response.status < 500) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Local Worker did not become ready within ${serverTimeoutMs}ms: ${lastError?.message || 'unknown error'}`);
}

function blockingIssues(issues) {
  return (issues || []).filter((issue) => {
    const code = String(issue.code || issue.type || '');
    if (ignoredCodes.has(code)) return false;
    if (code.includes('color-contrast') || code.includes('1_4_3')) return false;
    if (code.includes('aria-prohibited') || code.includes('aria-valid-attr')) return false;
    return true;
  });
}

const overallTimer = setTimeout(() => {
  console.error('[a11y] overall deadline reached; exiting');
  process.exit(1);
}, overallTimeoutMs);

installPa11y();
const pa11y = (await import('pa11y')).default;
const server = spawn(
  'npx',
  ['-y', 'wrangler@4.30.0', 'dev', '--local', '--ip', host, '--port', String(port)],
  { stdio: 'inherit', env: { ...process.env, CI: '1' }, detached: true },
);

let failed = false;
try {
  await waitForServer();
  for (const scan of scans) {
    for (const runner of ['htmlcs', 'axe']) {
      console.log(`\n[a11y] ${scan.name} | ${scan.viewport.width}x${scan.viewport.height} | ${runner}`);
      try {
        const results = await pa11y(`${baseUrl}${scan.path}`, {
          standard: 'WCAG2AA',
          runners: [runner],
          timeout: 20000,
          wait: scan.wait || 0,
          viewport: scan.viewport,
          chromeLaunchConfig: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
        });
        const issues = blockingIssues(results?.issues);
        const ignored = (results?.issues || []).length - issues.length;
        if (ignored) console.log(`[a11y] ignored ${ignored} pre-existing theme/ARIA issue(s)`);
        if (issues.length) {
          failed = true;
          console.error(`[a11y] FAILED: ${scan.name} | ${runner}: ${issues.length} issue(s)`);
          for (const issue of issues.slice(0, 12)) {
            console.error(`  - ${issue.code || issue.type}: ${issue.message} (${issue.selector || ''})`);
          }
        }
      } catch (error) {
        failed = true;
        console.error(`[a11y] FAILED: ${scan.name} | ${runner}: ${error.message}`);
      }
    }
  }
} catch (error) {
  failed = true;
  console.error(`[a11y] FAILED: ${error.message}`);
} finally {
  clearTimeout(overallTimer);
  try { if (server.pid) process.kill(-server.pid, 'SIGKILL'); } catch {}
  try { server.kill('SIGKILL'); } catch {}
}

process.exit(failed ? 1 : 0);
