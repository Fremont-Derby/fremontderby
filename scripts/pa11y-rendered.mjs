import { spawn } from 'node:child_process';
import process from 'node:process';

const host = '127.0.0.1';
const port = 8787;
const baseUrl = `http://${host}:${port}`;
const serverTimeoutMs = 30_000;
const scanTimeoutMs = 45_000;
const overallTimeoutMs = 4 * 60_000;

const scans = [
  { name: 'home desktop', path: '/', viewport: '1280x900' },
  { name: 'home phone', path: '/', viewport: '320x800' },
  {
    name: 'home phone menu open',
    path: '/',
    viewport: '320x800',
    actions: ['click element .fd-nav-menu summary'],
  },
  {
    name: 'standings truthful loading/recovery',
    path: '/standings',
    viewport: '320x800',
    wait: 250,
  },
];

function run(command, args, options = {}, timeoutMs = scanTimeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
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
  const args = [
    '-y',
    'pa11y@9.0.1',
    `${baseUrl}${scan.path}`,
    '--standard', 'WCAG2AA',
    '--runner', runner,
    '--threshold', '0',
    '--timeout', '20000',
    '--viewport', scan.viewport,
    '--reporter', 'cli',
    '--chrome-launch-config', '{"args":["--no-sandbox","--disable-setuid-sandbox"]}',
  ];
  if (scan.wait) args.push('--wait', String(scan.wait));
  for (const action of scan.actions || []) args.push('--actions', action);
  return args;
}

const deadline = Date.now() + overallTimeoutMs;
const server = spawn(
  'npx',
  ['-y', 'wrangler@4.30.0', 'dev', '--local', '--ip', host, '--port', String(port)],
  { stdio: 'inherit', env: { ...process.env, CI: '1' } },
);

let failed = false;
try {
  await waitForServer();
  for (const scan of scans) {
    for (const runner of ['htmlcs', 'axe']) {
      if (Date.now() > deadline) {
        failed = true;
        console.error('[a11y] overall deadline reached; remaining scans skipped');
        break;
      }
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
  server.kill('SIGTERM');
  setTimeout(() => server.kill('SIGKILL'), 2000);
}

if (failed) process.exitCode = 1;
