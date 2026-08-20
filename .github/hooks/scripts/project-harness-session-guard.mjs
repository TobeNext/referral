import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const statePath = '.git/project-harness-session.json';
const evidencePath = '.git/project-harness-verification.txt';
const relevant = /^(apps\/|contracts\/|compose\.yaml$|package\.json$|pnpm-lock\.yaml$|\.agents\/|\.github\/workflows\/|scripts\/|README\.md$)/;

function changedFiles() {
  const output = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
  return output.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).replaceAll('\\', '/')).filter((file) => relevant.test(file));
}

const command = process.argv[2];
if (command === 'session-start') {
  writeFileSync(statePath, JSON.stringify({ startedAt: new Date().toISOString(), files: changedFiles() }, null, 2));
  process.exit(0);
}
if (command === 'status') {
  console.log(JSON.stringify({ changed: changedFiles(), recorded: existsSync(evidencePath) }, null, 2));
  process.exit(0);
}
if (command === 'record') {
  writeFileSync(evidencePath, `${new Date().toISOString()} ${process.argv.slice(3).join(' ') || 'verified'}\n`);
  process.exit(0);
}
if (command === 'enforce-stop') {
  const changed = changedFiles();
  if (changed.length && !existsSync(evidencePath)) {
    console.error('Harness-relevant files changed without recorded verification. Run the checks and then: node .github/hooks/scripts/project-harness-session-guard.mjs record <evidence>');
    process.exit(1);
  }
  for (const ledger of ['.agents/maintenance/doc-gardening.md', '.agents/maintenance/debt-garbage-collection.md']) {
    if (!existsSync(ledger) || !readFileSync(ledger, 'utf8').trim()) process.exit(1);
  }
  process.exit(0);
}
console.error('Usage: session-start | status | record | enforce-stop');
process.exit(2);
