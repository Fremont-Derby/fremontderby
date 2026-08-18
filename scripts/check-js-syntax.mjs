import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_ROOTS = ['src', 'domain', 'scripts'];
export const EXCLUDED_DIRECTORIES = new Set(['.git', 'dist', 'node_modules', 'coverage', '.wrangler']);
export const INCLUDED_EXTENSIONS = new Set(['.js', '.mjs']);

export async function discoverJavaScriptFiles(cwd = process.cwd(), roots = DEFAULT_ROOTS) {
  const files = [];
  async function walk(relativeDirectory) {
    let entries;
    try {
      entries = await readdir(path.join(cwd, relativeDirectory), { withFileTypes: true });
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

export function checkJavaScriptSyntax(cwd, files, spawn = spawnSync) {
  for (const file of files) {
    const result = spawn(process.execPath, ['--check', file], { cwd, encoding: 'utf8' });
    if (result.status !== 0) {
      return { ok: false, file, output: [result.stdout, result.stderr].filter(Boolean).join('\n').trim() };
    }
  }
  return { ok: true, checked: files.length };
}

async function main() {
  const cwd = process.cwd();
  const files = await discoverJavaScriptFiles(cwd);
  const result = checkJavaScriptSyntax(cwd, files);
  if (!result.ok) {
    console.error(`Syntax check failed: ${result.file}`);
    if (result.output) console.error(result.output);
    return 1;
  }
  console.log(`Syntax checked ${result.checked} JavaScript modules.`);
  return 0;
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  process.exitCode = await main();
}
