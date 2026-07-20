export interface SourceFile {
  path: string
  text: string
}

export interface MissingSourceUsage {
  path: string
  line: number
}

// Named exceptions for a deliberate legacy `<AlertSignup>` call site that can't
// carry `source` yet — empty today (verified by direct scan: all real call sites
// already pass `source`). Add `path` here only with a comment explaining why.
export const ALERT_SIGNUP_SOURCE_ALLOWLIST: string[] = []

const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//g
const ALERT_SIGNUP_TAG_RE = /<AlertSignup\b[\s\S]*?\/>/g

// Strip block comments before scanning so JSDoc prose that merely *mentions*
// `<AlertSignup>` (e.g. "the below-the-list `<AlertSignup>` uses") never gets
// mistaken for a real usage.
function stripBlockComments(text: string): string {
  return text.replace(BLOCK_COMMENT_RE, (match) => ' '.repeat(match.length))
}

export function findAlertSignupUsagesMissingSource(files: SourceFile[]): MissingSourceUsage[] {
  const missing: MissingSourceUsage[] = []
  for (const file of files) {
    if (ALERT_SIGNUP_SOURCE_ALLOWLIST.includes(file.path)) continue
    const stripped = stripBlockComments(file.text)
    for (const match of stripped.matchAll(ALERT_SIGNUP_TAG_RE)) {
      const tag = match[0]
      if (tag.includes('source=') || tag.includes('{...')) continue
      const line = stripped.slice(0, match.index ?? 0).split('\n').length
      missing.push({ path: file.path, line })
    }
  }
  return missing
}
