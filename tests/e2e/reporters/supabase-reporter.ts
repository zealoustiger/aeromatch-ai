import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter'
import { admin } from '../helpers/supabase'

// Streams per-test results to Supabase so the /admin/smoke page can show a run
// live. Active ONLY when SMOKE_RUN_ID is set (i.e. a run was requested from the
// admin and the VPS picked it up) — a plain `npm run test:smoke` no-ops here.
const RUN_ID = process.env.SMOKE_RUN_ID

export default class SupabaseReporter implements Reporter {
  private passed = 0
  private failed = 0
  private skipped = 0

  async onBegin() {
    if (!RUN_ID) return
    await admin
      .from('smoke_runs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', RUN_ID)
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    if (!RUN_ID) return
    // The setup project's login step is plumbing, not a user-facing flow — don't
    // surface it as one of the "tests" in the admin view.
    if (test.title === 'authenticate') return

    const status = result.status // passed | failed | timedOut | skipped | interrupted
    if (status === 'passed') this.passed++
    else if (status === 'skipped') this.skipped++
    else this.failed++

    await admin.from('smoke_tests').insert({
      run_id: RUN_ID,
      name: test.title,
      status,
      duration_ms: Math.round(result.duration),
      error: result.error?.message?.replace(/\[[0-9;]*m/g, '').slice(0, 1000) ?? null,
    })
  }

  async onEnd(result: FullResult) {
    if (!RUN_ID) return
    const final = this.failed > 0 || result.status === 'failed' ? 'failed' : 'passed'
    await admin
      .from('smoke_runs')
      .update({
        status: final,
        finished_at: new Date().toISOString(),
        passed: this.passed,
        failed: this.failed,
        skipped: this.skipped,
      })
      .eq('id', RUN_ID)
  }
}
