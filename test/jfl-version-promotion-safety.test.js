import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

test('JFL scripts and workflows never promote secret-only Worker versions', () => {
  const scriptsDir = new URL('../scripts/', import.meta.url);
  for (const name of readdirSync(scriptsDir).filter((file) => file.endsWith('.mjs'))) {
    const source = readFileSync(new URL(name, scriptsDir), 'utf8');
    const executable = source.split(/\r?\n/).filter((line) => !/^\s*(?:\/\/|\*)/.test(line)).join('\n');
    assert.doesNotMatch(
      executable,
      /['"]versions['"]\s*,\s*['"](?:secret|deploy)['"]/,
      `${name} must not promote Worker versions through secret repair`,
    );
  }

  const workflowsDir = new URL('../.github/workflows/', import.meta.url);
  for (const name of readdirSync(workflowsDir).filter((file) => /\.ya?ml$/.test(file))) {
    const source = readFileSync(new URL(name, workflowsDir), 'utf8');
    const executable = source.split(/\r?\n/).filter((line) => !/^\s*#/.test(line)).join('\n');
    assert.doesNotMatch(
      executable,
      /wrangler(?:@\d+)?\s+versions\s+(?:secret|deploy)\b/,
      `${name} must not promote Worker versions through secret repair`,
    );
  }
});
