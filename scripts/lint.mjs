import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', 'dist']);
const checkedExtensions = new Set(['.js', '.mjs', '.md', '.json', '.jsonc', '.yml', '.yaml']);
const errors = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!checkedExtensions.has(path.extname(entry.name))) continue;

    const relative = path.relative(root, fullPath);
    const text = fs.readFileSync(fullPath, 'utf8');
    const lines = text.split('\n');

    lines.forEach((line, index) => {
      if (/\s+$/.test(line) && line.length > 0) {
        errors.push(`${relative}:${index + 1} trailing whitespace`);
      }
      if (line.includes('\t')) {
        errors.push(`${relative}:${index + 1} tab character`);
      }
    });

    if (text.length > 0 && !text.endsWith('\n')) {
      errors.push(`${relative}: missing final newline`);
    }
  }
}

walk(root);

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Source lint passed.');
