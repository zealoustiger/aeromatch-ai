'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { promisify } from 'util'
import { execFile as _execFile } from 'child_process'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/admin-auth'

const execFile = promisify(_execFile)
const REPO = process.cwd()
const FEEDBACK_PATH = path.join(REPO, 'nightshift', 'FEEDBACK.md')

/** Append the admin's reaction/notes on the daily report to nightshift/FEEDBACK.md.
 *  Claude reads this file to turn feedback into backlog items. Admin only. */
export async function submitReportFeedback(formData: FormData) {
  await assertAdmin()
  const text = String(formData.get('feedback') ?? '').trim()
  if (!text) return
  const ts = new Date().toISOString()
  const entry = `\n## ${ts}\n${text}\n`
  await fs.appendFile(FEEDBACK_PATH, entry, 'utf8')
  revalidatePath('/admin')
}

/** Promote everything on staging to production by fast-forwarding origin/main to
 *  origin/staging. Vercel then deploys main to prod. Fast-forward only (never
 *  force) so a diverged main fails safe. Admin only, runs locally. */
export async function promoteToProduction(): Promise<{ ok: boolean; message: string }> {
  await assertAdmin()
  try {
    await execFile('git', ['fetch', 'origin', '--quiet'], { cwd: REPO })
    const { stdout } = await execFile('git', ['rev-list', '--count', 'origin/main..origin/staging'], { cwd: REPO })
    const count = parseInt(stdout.trim(), 10) || 0
    if (count === 0) return { ok: true, message: 'Already up to date — nothing on staging to promote.' }
    // Push the commit at origin/staging onto main (fast-forward only by default).
    await execFile('git', ['push', 'origin', 'origin/staging:main'], { cwd: REPO })
    return {
      ok: true,
      message: `Promoted ${count} commit${count === 1 ? '' : 's'} from staging to production. Vercel is deploying main now.`,
    }
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string }
    const detail = (e.stderr || e.message || String(err)).slice(0, 400)
    const hint = /non-fast-forward|rejected|fetch first/i.test(detail)
      ? ' (main has commits not on staging — it diverged. Reconcile manually before promoting.)'
      : ''
    return { ok: false, message: `Promote failed${hint}: ${detail}` }
  }
}
