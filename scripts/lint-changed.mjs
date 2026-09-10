/**
 * Ratchet lint gate (user decision 2026-09: changed-files strategy).
 *
 * Lints ONLY the TS/TSX files changed vs a base ref, so CI is green today
 * and tightens automatically as files get touched. Full-repo lint remains
 * advisory (see .github/workflows/ci.yml).
 *
 * Usage: node scripts/lint-changed.mjs [base]   (base defaults to "main";
 * pass a SHA or a ref containing "~" to use it verbatim)
 *
 * The diff runs against the WORKING TREE (git diff <base>), not <base>...HEAD,
 * so uncommitted work is gated too - in CI (PR checkout) the working tree IS
 * the merge commit, so the semantics match the PR diff exactly.
 */
import { execSync } from 'node:child_process';

const rawArg = process.argv[2] || 'main';
// Accept "origin/main" as "main" - the script adds the origin/ prefix itself.
const arg = rawArg.startsWith('origin/') ? rawArg.slice('origin/'.length) : rawArg;
const baseRef = /^[0-9a-f]{7,}$/.test(arg) || arg.includes('~') || arg.includes('^')
    ? arg
    : `origin/${arg}`;

const sh = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

// Shallow CI checkouts may not have the base ref yet.
try {
    sh(`git rev-parse --verify ${baseRef}`);
} catch {
    sh(`git fetch origin ${arg} --depth=1`);
}

// ACMRTUXB = added/copied/modified/renamed/type-changed/updated - drops
// deleted paths so we never lint a file that no longer exists.
const files = sh(`git diff --name-only --diff-filter=ACMRTUXB ${baseRef}`)
    .split('\n')
    .filter(Boolean)
    .filter((f) => /\.(ts|tsx)$/.test(f));

if (files.length === 0) {
    console.log(`[lint-changed] no TS/TSX files changed vs ${baseRef} - nothing to lint.`);
    process.exit(0);
}

console.log(`[lint-changed] linting ${files.length} changed file(s) vs ${baseRef} ...`);
execSync(`eslint ${files.join(' ')}`, { stdio: 'inherit' });
