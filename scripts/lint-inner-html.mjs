/**
 * Soft guard: flag innerHTML assignments that concatenate variables (likely untrusted).
 * Static string innerHTML (table chrome) is allowed.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKIP_PATH_SUBSTRINGS = Object.freeze(['Sandbox', 'sandbox']);

/** True when a source line looks like dynamic / concatenative innerHTML assignment. */
export function isDynamicInnerHtmlLine(line) {
  if (!line.includes('innerHTML')) return false;
  if (line.includes('${') || /innerHTML\s*=\s*[^'"`]/.test(line)) {
    if (/innerHTML\s*=\s*['`][^`$]*['`]/.test(line) && !line.includes('${')) return false;
    return true;
  }
  return false;
}

export function shouldSkipFile(filePath) {
  return SKIP_PATH_SUBSTRINGS.some((s) => filePath.includes(s));
}

export function collectInnerHtmlOffenders(lines, filePath) {
  const offenders = [];
  lines.forEach((line, i) => {
    if (isDynamicInnerHtmlLine(line)) {
      offenders.push(`${filePath}:${i + 1}: ${line.trim().slice(0, 160)}`);
    }
  });
  return offenders;
}

export function walkJsFiles(dir, { readdirSync: readdir = readdirSync } = {}, out = []) {
  for (const ent of readdir(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walkJsFiles(p, { readdirSync: readdir }, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

export function lintInnerHtmlTree(
  rootDir = 'src',
  {
    readdirSync: readdir = readdirSync,
    readFileSync: readFile = readFileSync,
  } = {},
) {
  const offenders = [];
  for (const file of walkJsFiles(rootDir, { readdirSync: readdir })) {
    if (shouldSkipFile(file)) continue;
    const lines = readFile(file, 'utf8').split('\n');
    offenders.push(...collectInnerHtmlOffenders(lines, file));
  }
  return offenders;
}

const isDirect =
  process.argv[1] && fileURLToPath(import.meta.url) === join(process.cwd(), process.argv[1].replace(/^\.\//, '')) ||
  (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]);

if (isDirect) {
  const offenders = lintInnerHtmlTree('src');
  if (offenders.length) {
    console.error('Potential dynamic innerHTML (review for XSS):\n' + offenders.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('lint-inner-html: no dynamic concatenations flagged');
  }
}
