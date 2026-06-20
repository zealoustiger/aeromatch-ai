'use server'

import { promisify } from 'util'
import { execFile as _execFile } from 'child_process'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

const execFile = promisify(_execFile)

/** Save the admin's reaction/notes on the daily report to the shared DB so it
 *  works from the production admin (Vercel's filesystem is read-only). Claude
 *  reads `report_feedback` to turn feedback into backlog items. Admin only. */
export async function submitReportFeedback(formData: FormData) {
  await assertAdmin()
  const body = String(formData.get('feedback') ?? '').trim()
  if (!body) return
  const admin = createAdminClient()
  await admin.from('report_feedback').insert({ body })
  revalidatePath('/admin')
}

/** Promote everything on staging to production by fast-forwarding origin/main to
 *  origin/staging (Vercel then deploys main). Fast-forward only — a diverged main
 *  fails safe. Runs git, so it only works on a local machine; on the deployed prod
 *  server it returns guidance instead. Admin only. */
export async function promoteToProduction(): Promise<{ ok: boolean; message: string }> {
  await assertAdmin()
  if (process.env.VERCEL) {
    return {
      ok: false,
      message:
        'This Promote button pushes git, so it runs from your local machine. Run the app locally and click here, or just tell Claude "promote" and it ships staging to production.',
    }
  }
  const REPO = process.cwd()
  try {
    await execFile('git', ['fetch', 'origin', '--quiet'], { cwd: REPO })
    const { stdout } = await execFile('git', ['rev-list', '--count', 'origin/main..origin/staging'], { cwd: REPO })
    const count = parseInt(stdout.trim(), 10) || 0
    if (count === 0) return { ok: true, message: 'Already up to date — nothing on staging to promote.' }
    await execFile('git', ['push', 'origin', 'origin/staging:main'], { cwd: REPO })
    return {
      ok: true,
      message: `Promoted ${count} commit${count === 1 ? '' : 's'} from staging to production. Vercel is deploying main now.`,
    }
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string }
    const detail = (e.stderr || e.message || String(err)).slice(0, 400)
    const hint = /non-fast-forward|rejected|fetch first/i.test(detail)
      ? ' (main diverged from staging — reconcile manually before promoting.)'
      : ''
    return { ok: false, message: `Promote failed${hint}: ${detail}` }
  }
}
