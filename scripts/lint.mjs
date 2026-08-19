import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const IGNORED_DIRECTORY_NAMES = Object.freeze(['.git', 'node_modules', 'dist']);

export const CHECKED_EXTENSIONS = Object.freeze(
  new Set(['.js', '.mjs', '.md', '.json', '.jsonc', '.yml', '.yaml']),
);

/**
 * Lint a single file's text. Returns human-readable error strings with relative path + line.
 * Pure: no filesystem access.
 */
export function lintText(relativePath, text) {
  const errors = [];
  const lines = text
    .split('\n')
    .map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line));

  lines.forEach((line, index) => {
    if (/\s+$/.test(line) && line.length > 0) {
      errors.push(`${relativePath}:${index + 1} trailing whitespace`);
    }
    if (line.includes('\t')) {
      errors.push(`${relativePath}:${index + 1} tab character`);
    }
  });

  if (text.length > 0 && !text.endsWith('\n')) {
    errors.push(`${relativePath}: missing final newline`);
  }

  return errors;
}

export function shouldCheckFile(fileName) {
  return CHECKED_EXTENSIONS.has(path.extname(fileName));
}

export function shouldIgnoreDirectory(dirName) {
  return IGNORED_DIRECTORY_NAMES.includes(dirName);
}

/**
 * Walk a directory tree and collect lint errors. Injectable fs for tests.
 */
export function lintTree(root, { readdirSync = fs.readdirSync, readFileSync = fs.readFileSync } = {}) {
  const errors = [];

  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (shouldIgnoreDirectory(entry.name)) continue;
        walk(path.join(directory, entry.name));
        continue;
      }

      if (!shouldCheckFile(entry.name)) continue;

      const fullPath = path.join(directory, entry.name);
      const relative = path.relative(root, fullPath);
      const text = readFileSync(fullPath, 'utf8');
      errors.push(...lintText(relative, text));
    }
  }

  walk(root);
  return errors;
}

const isDirect =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirect) {
  const errors = lintTree(process.cwd());
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('Source lint passed.');
}
