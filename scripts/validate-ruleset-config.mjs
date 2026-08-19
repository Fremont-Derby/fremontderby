#!/usr/bin/env node
/**
 * Pure validation for .github/rulesets/fremontderby-rulesets.json (#1185).
 * Does not call the GitHub API — authoring/validation only.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const REQUIRED_MAIN_CHECKS = Object.freeze([
  'test',
  'accessibility',
  'pr-card-contract',
  'validate',
]);

export function validateRulesetConfig(config) {
  const errors = [];
  if (!config || config.version !== 1 || !Array.isArray(config.rulesets)) {
    return ['Config must have version 1 and a rulesets array.'];
  }

  const names = new Set();
  for (const [index, ruleset] of config.rulesets.entries()) {
    const loc = `rulesets[${index}]`;
    if (!ruleset?.name || typeof ruleset.name !== 'string') {
      errors.push(`${loc}.name is required`);
      continue;
    }
    if (names.has(ruleset.name)) errors.push(`Duplicate ruleset name: ${ruleset.name}`);
    names.add(ruleset.name);
    if (ruleset.target !== 'branch') errors.push(`${loc}.target must be branch`);
    if (!['active', 'evaluate', 'disabled'].includes(ruleset.enforcement)) {
      errors.push(`${loc}.enforcement must be active|evaluate|disabled`);
    }
    if (!Array.isArray(ruleset.rules) || ruleset.rules.length === 0) {
      errors.push(`${loc}.rules must be a non-empty array`);
    }
  }

  for (const required of ['Main block', 'Gamma promotion', 'JFL permanent branch', 'DRU permanent branch']) {
    if (!names.has(required)) errors.push(`Missing required ruleset: ${required}`);
  }

  const mainChecks = config.requiredStatusChecks?.main || [];
  for (const check of REQUIRED_MAIN_CHECKS) {
    if (!mainChecks.includes(check)) {
      errors.push(`requiredStatusChecks.main missing "${check}"`);
    }
  }

  return errors;
}

export function loadRulesetConfig(path = '.github/rulesets/fremontderby-rulesets.json') {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  const config = loadRulesetConfig();
  const errors = validateRulesetConfig(config);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`Ruleset config OK (${config.rulesets.length} rulesets)`);
  }
}
