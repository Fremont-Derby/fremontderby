#!/usr/bin/env node
// Local reminder. The tracking card lives on the open pull request, so this
// queries GitHub instead of trusting a branch note or a memory variable.
import { execFileSync } from 'node:child_process';

const repo = 'Fremont-Derby/fremontderby';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' }).trim();
}

function trackingCard(body) {
  const lines = String(body || '').split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === '## tracking card');
  if (start === -1) return '';
  const next = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  return lines.slice(start + 1, next === -1 ? lines.length : next).join('\n');
}

function main() {
  let branch = '';
  try {
    branch = git(['branch', '--show-current']);
  } catch {
    return;
  }
  if (!branch || branch === 'main' || branch === 'fremontderby-gamma' || branch === 'fremontderby-dru') {
    return;
  }

  let pulls = [];
  try {
    pulls = JSON.parse(gh([
      'pr', 'list',
      '--repo', repo,
      '--head', branch,
      '--state', 'open',
      '--json', 'number,title,body,url',
    ]));
  } catch (error) {
    console.log(`PR card reminder: could not query the open pull request for ${branch}. Attach a Tracking card before you push.`);
    console.log(String(error.stderr || error.message || error).split('\n')[0]);
    return;
  }

  if (!pulls.length) {
    console.log(`PR card reminder: ${branch} has no open pull request. Open one with a Tracking card section before you treat this commit as ready.`);
    return;
  }

  const pull = pulls[0];
  const section = trackingCard(pull.body);
  const hasCard = /\b(?:Tracks|Refs)\s+#\d+\b/.test(section);
  if (hasCard) return;

  console.log(`PR card reminder: #${pull.number} has no Tracking card line.`);
  console.log('Add a "## Tracking card" section with "Tracks #123" before the card check will pass.');
  console.log(pull.url);
}

main();
