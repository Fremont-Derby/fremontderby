import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_ROOTS = Object.freeze(['src', 'domain', 'scripts']);
export const EXCLUDED_DIRECTORIES = Object.freeze(
  new Set(['.git', 'dist', 'node_modules', 'coverage', '.wrangler']),
);
export const INCLUDED_EXTENSIONS = Object.freeze(new Set(['.js', '.mjs']));

export async function discoverJavaScriptFiles(
  cwd = process.cwd(),
  roots = DEFAULT_ROOTS,
  { readdirImpl = readdir } = {},
) {
  const files = [];
  async function walk(relativeDirectory) {
    let entries;
    try {
      entries = await readdirImpl(path.join(cwd, relativeDirectory), { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const relativePath = path.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRECTORIES.has(entry.name)) await walk(relativePath);
      } else if (entry.isFile() && INCLUDED_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(relativePath);
      }
    }
  }
  for (const root of roots) await walk(root);
  return files.sort((left, right) => left.localeCompare(right));
}

export function checkJavaScriptSyntax(cwd, files, { spawnImpl = spawnSync, execPath = process.execPath } = {}) {
  for (const file of files) {
    const result = spawnImpl(execPath, ['--check', file], { cwd, encoding: 'utf8' });
    if (result.status !== 0) {
      return {
        ok: false,
        file,
        output: [result.stdout, result.stderr].filter(Boolean).join('\n').trim(),
      };
    }
  }
  return { ok: true, checked: files.length };
}

export async function runCheckJsSyntax({
  cwd = process.cwd(),
  roots = DEFAULT_ROOTS,
  readdirImpl = readdir,
  spawnImpl = spawnSync,
  execPath = process.execPath,
} = {}) {
  const files = await discoverJavaScriptFiles(cwd, roots, { readdirImpl });
  return checkJavaScriptSyntax(cwd, files, { spawnImpl, execPath });
}

const isDirect =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirect) {
  const result = await runCheckJsSyntax();
  if (!result.ok) {
    console.error(`Syntax check failed: ${result.file}`);
    if (result.output) console.error(result.output);
    process.exitCode = 1;
  } else {
    console.log(`Syntax checked ${result.checked} JavaScript modules.`);
  }
}
