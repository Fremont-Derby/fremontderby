import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOTS = ['src', 'domain', 'scripts'];
const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  'dist',
  'node_modules',
  'coverage',
  '.wrangler',
]);
const INCLUDED_EXTENSIONS = new Set(['.js', '.mjs']);

export async function discoverJavaScriptFiles(cwd = process.cwd(), roots = DEFAULT_ROOTS) {
  const files = [];

  async function walk(relativeDirectory) {
    const absoluteDirectory = path.join(cwd, relativeDirectory);
    let entries;
    try {
      entries = await readdir(absoluteDirectory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }

    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const relativePath = path.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRECTORIES.has(entry.name)) await walk(relativePath);
        continue;
      }
      if (entry.isFile() && INCLUDED_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(relativePath);
      }
    }
  }

  for (const root of roots) await walk(root);
  return files.sort((left, right) => left.localeCompare(right));
}

export function checkJavaScriptSyntax(cwd, files) {
  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], {
      cwd,
      encoding: 'utf8',
    });
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

export async function main(cwd = process.cwd()) {
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

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  process.exitCode = await main();
}
