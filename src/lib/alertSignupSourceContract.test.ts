/**
 * Run: node --experimental-strip-types --test src/lib/alertSignupSourceContract.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  findAlertSignupUsagesMissingSource,
  ALERT_SIGNUP_SOURCE_ALLOWLIST,
} from './alertSignupSourceContract.ts'

test('findAlertSignupUsagesMissingSource: ignores a comment-only mention', () => {
  const text = `
    /** Filter-aware email-alert context/source path — same values the page's own
     *  below-the-list \`<AlertSignup>\` uses. */
    export function foo() {}
  `
  assert.deepEqual(findAlertSignupUsagesMissingSource([{ path: 'fixture.tsx', text }]), [])
})

test('findAlertSignupUsagesMissingSource: flags a single-line tag missing source', () => {
  const text = `<AlertSignup sourcePath="/aircraft" noun="aircraft" />`
  const missing = findAlertSignupUsagesMissingSource([{ path: 'fixture.tsx', text }])
  assert.equal(missing.length, 1)
  assert.equal(missing[0].path, 'fixture.tsx')
  assert.equal(missing[0].line, 1)
})

test('findAlertSignupUsagesMissingSource: does not flag a tag with source', () => {
  const text = `<AlertSignup sourcePath="/aircraft" source="browse_hub" />`
  assert.deepEqual(findAlertSignupUsagesMissingSource([{ path: 'fixture.tsx', text }]), [])
})

test('findAlertSignupUsagesMissingSource: detects a multi-line tag missing source', () => {
  const text = `
    <AlertSignup
      context={label}
      sourcePath={path}
      noun="partnership"
    />
  `
  const missing = findAlertSignupUsagesMissingSource([{ path: 'fixture.tsx', text }])
  assert.equal(missing.length, 1)
  assert.equal(missing[0].line, 2)
})

test('findAlertSignupUsagesMissingSource: a multi-line tag with source is not flagged', () => {
  const text = `
    <AlertSignup
      context={label}
      sourcePath={path}
      source="make_model_page"
    />
  `
  assert.deepEqual(findAlertSignupUsagesMissingSource([{ path: 'fixture.tsx', text }]), [])
})

test('findAlertSignupUsagesMissingSource: an allowlisted path is skipped', () => {
  const text = `<AlertSignup sourcePath="/aircraft" />`
  const fixturePath = 'fixture-allowlisted.tsx'
  assert.equal(findAlertSignupUsagesMissingSource([{ path: fixturePath, text }]).length, 1)
  ALERT_SIGNUP_SOURCE_ALLOWLIST.push(fixturePath)
  try {
    assert.deepEqual(findAlertSignupUsagesMissingSource([{ path: fixturePath, text }]), [])
  } finally {
    ALERT_SIGNUP_SOURCE_ALLOWLIST.pop()
  }
})

function collectTsxFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectTsxFiles(full))
    else if (entry.name.endsWith('.tsx')) out.push(full)
  }
  return out
}

test('contract: every real <AlertSignup> call site in src/ passes source', () => {
  const srcDir = path.join(import.meta.dirname, '..')
  const files = collectTsxFiles(srcDir).map((full) => ({
    path: path.relative(srcDir, full),
    text: fs.readFileSync(full, 'utf8'),
  }))
  const missing = findAlertSignupUsagesMissingSource(files)
  assert.deepEqual(
    missing,
    [],
    `Found <AlertSignup> usage(s) missing a source prop: ${JSON.stringify(missing)}. ` +
      `Add source="<placement_name>" so this capture point is attributable in the ` +
      `admin scoreboard, or add the path to ALERT_SIGNUP_SOURCE_ALLOWLIST with a comment why.`,
  )
})
