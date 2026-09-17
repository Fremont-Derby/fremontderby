import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const host = '127.0.0.1';
const port = 8787;
const baseUrl = `http://${host}:${port}`;
const serverTimeoutMs = 30_000;
/** Per-scan hard kill for hung Chromium/pa11y. */
const scanTimeoutMs = 45_000;
const configDir = mkdtempSync(join(tmpdir(), 'pa11y-config-'));

const scans = [
  { name: 'home desktop', path: '/', viewport: '1280x900' },
  { name: 'home phone', path: '/', viewport: '320x800' },
  {
    name: 'home phone menu open',
    path: '/',
    viewport: '320x800',
    // Avoid unbounded "wait for element … to be visible" (known hang).
    actions: ['click element .fd-nav-menu summary'],
    wait: 500,
  },
  {
    name: 'standings truthful loading/recovery',
    path: '/standings',
    viewport: '320x800',
    wait: 250,
  },
];

function killTree(child) {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    try {
      child.kill('SIGKILL');
    } catch {
      // ignore
    }
  }
}

function run(command, args, options = {}, timeoutMs = scanTimeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      detached: true,
      ...options,
    });
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      killTree(child);
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.once('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${code ?? signal ?? 'unknown'}`));
    });
  });
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

function pa11yArgs(scan, runner) {
  const [width, height] = scan.viewport.split('x').map(Number);
  const configPath = join(configDir, `${scan.name.replace(/\W+/g, '_')}-${runner}.json`);
  writeFileSync(configPath, `${JSON.stringify({
    standard: 'WCAG2AA',
    runners: [runner],
    threshold: 0,
    timeout: scanTimeoutMs,
    wait: scan.wait || 0,
    actions: scan.actions || [],
    viewport: { width, height },
    chromeLaunchConfig: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  }, null, 2)}\n`);

  return [
    '-y',
    'pa11y@9.0.1',
    `${baseUrl}${scan.path}`,
    '--config', configPath,
    '--reporter', 'cli',
    '--timeout', String(scanTimeoutMs),
  ];
}

const server = spawn(
  'npx',
  ['-y', 'wrangler@4.30.0', 'dev', '--local', '--ip', host, '--port', String(port)],
  { stdio: 'inherit', detached: true, env: { ...process.env, CI: '1' } },
);

let failed = false;
try {
  await waitForServer();
  for (const scan of scans) {
    for (const runner of ['htmlcs', 'axe']) {
      console.log(`\n[a11y] ${scan.name} | ${scan.viewport} | ${runner}`);
      try {
        await run('npx', pa11yArgs(scan, runner), { env: { ...process.env, CI: '1' } }, scanTimeoutMs);
      } catch (error) {
        failed = true;
        console.error(`[a11y] FAILED: ${scan.name} | ${scan.viewport} | ${runner}: ${error.message}`);
      }
    }
  }
} catch (error) {
  failed = true;
  console.error(`[a11y] FAILED: ${error.message}`);
} finally {
  killTree(server);
}

// wrangler/workerd otherwise keeps the event loop alive past scan failures
process.exit(failed ? 1 : 0);
