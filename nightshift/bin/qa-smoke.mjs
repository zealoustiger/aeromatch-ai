#!/usr/bin/env node
// Night Shift headless QA smoke test (replaces gstack /browse on the VPS).
//
// Programmatic gate + saves ONE "after" screenshot per page/viewport for the QA
// agent to visually inspect. Screenshots are kept on disk (cheap audit trail /
// Forge can surface the latest) but are NOT meant for human review — the human-
// facing review is the staging site itself.
//
// Assumes the production server is already running (worker does `next build` +
// `next start` first, per RUNBOOK). This script only drives the browser.
//
// Usage:
//   node nightshift/bin/qa-smoke.mjs --slug <slug> [--base http://localhost:3000] <path> [<path>...]
// Exits 0 if every check passes, 1 if any fails (so the worker can gate the merge
// on exit code). Prints a JSON summary to stdout for the worker to read.
//
// Programmatic checks per page × viewport (desktop 1280, mobile 375):
//   - HTTP status 200–399
//   - zero app-origin console errors / pageerrors (known external CDN noise ignored)
//   - zero horizontal overflow (documentElement.scrollWidth > clientWidth)
// A failure on ANY of these fails the gate. The screenshot is for the agent's
// separate visual sanity pass (catches "renders but looks wrong").

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
let slug = 'qa';
let base = 'http://localhost:3000';
const paths = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--slug') slug = argv[++i];
  else if (argv[i] === '--base') base = argv[++i];
  else paths.push(argv[i]);
}
if (paths.length === 0) {
  console.error('qa-smoke: no paths given. Usage: --slug <slug> <path> [<path>...]');
  process.exit(2);
}

// repo root = nightshift/bin/../..
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const shotDir = join(repoRoot, 'nightshift', 'screenshots', slug);
mkdirSync(shotDir, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
];

// Pre-existing external noise that is NOT an app regression (seen in prior QA notes:
// the Next image optimizer fetching upload.wikimedia.org placeholder photos gets 429s).
const IGNORE_CONSOLE = [/upload\.wikimedia\.org/i, /\b429\b/, /favicon/i];

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const results = [];
let ok = true;

for (const path of paths) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') {
        const t = m.text();
        if (!IGNORE_CONSOLE.some((r) => r.test(t))) consoleErrors.push(t.slice(0, 200));
      }
    });
    page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message.slice(0, 200)));

    let status = 0;
    let overflow = 0;
    let screenshot = '';
    try {
      const resp = await page.goto(base + path, { waitUntil: 'load', timeout: 30000 });
      status = resp ? resp.status() : 0;
      await page.waitForTimeout(800); // let hydration settle
      overflow = await page.evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
      );
      const fileSlug = (path.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root');
      screenshot = join(shotDir, `${fileSlug}-${vp.name}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
    } catch (e) {
      consoleErrors.push('nav: ' + String(e.message || e).slice(0, 200));
    }

    const pass =
      status >= 200 && status < 400 && consoleErrors.length === 0 && overflow === 0;
    if (!pass) ok = false;
    results.push({ path, viewport: vp.name, status, overflow, consoleErrors, screenshot, pass });
    await ctx.close();
  }
}

await browser.close();
console.log(JSON.stringify({ slug, ok, checked: results.length, results }, null, 2));
process.exit(ok ? 0 : 1);
