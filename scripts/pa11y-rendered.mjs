import { spawn } from 'node:child_process';
import process from 'node:process';

const host = '127.0.0.1';
const port = 8787;
const baseUrl = `http://${host}:${port}`;
const serverTimeoutMs = 20_000;
const scanTimeoutMs = 45_000;
const overallTimeoutMs = 3 * 60_000;

const scans = [
  { name: 'home desktop', path: '/', width: 1280, height: 900 },
  { name: 'home phone', path: '/', width: 320, height: 800 },
  { name: 'standings truthful loading/recovery', path: '/standings', width: 320, height: 800, wait: 250 },
];

function run(command, args, options = {}, timeoutMs = scanTimeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (code, signal) => {
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
  const chrome = JSON.stringify({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: scan.width, height: scan.height },
  });
  const args = [
    '-y', 'pa11y@9.0.1',
    `${baseUrl}${scan.path}`,
    '--standard', 'WCAG2AA',
    '--runner', runner,
    '--threshold', '0',
    '--timeout', '20000',
    '--reporter', 'cli',
    '--chrome-launch-config', chrome,
  ];
  if (scan.wait) args.push('--wait', String(scan.wait));
  return args;
}

const overallTimer = setTimeout(() => {
  console.error('[a11y] overall deadline reached; exiting');
  process.exit(1);
}, overallTimeoutMs);

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
      console.log(`\n[a11y] ${scan.name} | ${scan.width}x${scan.height} | ${runner}`);
      try {
        await run('npx', pa11yArgs(scan, runner), { env: { ...process.env, CI: '1' } });
      } catch (error) {
        failed = true;
        console.error(`[a11y] FAILED: ${scan.name} | ${scan.width}x${scan.height} | ${runner}: ${error.message}`);
      }
    }
  }
} catch (error) {
  failed = true;
  console.error(`[a11y] FAILED: ${error.message}`);
} finally {
  clearTimeout(overallTimer);
  try {
    if (server.pid) process.kill(-server.pid, 'SIGKILL');
  } catch {}
  try { server.kill('SIGKILL'); } catch {}
}

process.exit(failed ? 1 : 0);
