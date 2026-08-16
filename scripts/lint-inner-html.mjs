/**
 * Soft guard: flag innerHTML assignments that concatenate variables (likely untrusted).
 * Static string innerHTML (table chrome) is allowed.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

const offenders = [];
for (const file of walk('src')) {
  if (file.includes('Sandbox') || file.includes('sandbox')) continue; // demo-only
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!line.includes('innerHTML')) return;
    // dynamic if template with ${ or string concat with +
    if (line.includes('innerHTML') && (line.includes('${') || /innerHTML\s*=\s*[^'"`]/.test(line))) {
      if (/innerHTML\s*=\s*['`][^`$]*['`]/.test(line) && !line.includes('${')) return;
      offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 160)}`);
    }
  });
}

if (offenders.length) {
  console.error('Potential dynamic innerHTML (review for XSS):\n' + offenders.join('\n'));
  process.exitCode = 1;
} else {
  console.log('lint-inner-html: no dynamic concatenations flagged');
}
