// Gentle inter-send pacing + a time-budget guard for the alert-digest cron's
// send loops. Prevention (this file) complements the recovery
// `withEmailRetry`/`planEmailRetry` in `email.ts` already provides: pacing
// keeps the loop from hammering Resend's ~2 req/s limit in the first place,
// and the budget guard stops starting new sends before the route's
// `maxDuration = 60` would cut one off mid-flight, rather than letting the
// tail of a grown list silently drop every run.
//
// Deliberately import-free (like email.ts) so its unit test can load it
// under `node --test` with no build step.

/** Minimum wait between consecutive sends within one cron run. */
export const SEND_PACE_MS = 400

/** Matches the alert-digest route's `export const maxDuration = 60`. */
export const CRON_TIME_BUDGET_MS = 60_000

/**
 * Stop starting new sends once the run is within this much of the deadline —
 * leaves room for a send already in flight (including its own retry/backoff)
 * to finish before Vercel kills the function mid-send.
 */
export const CRON_TIME_SAFETY_MARGIN_MS = 8_000

/**
 * Pure decision: given how long the run has been going, should the NEXT send
 * be deferred (skipped this pass) rather than started? Injectable budget/
 * margin keep this testable without real timers.
 */
export function shouldDeferSend(
  elapsedMs: number,
  budgetMs: number = CRON_TIME_BUDGET_MS,
  marginMs: number = CRON_TIME_SAFETY_MARGIN_MS
): boolean {
  return elapsedMs >= budgetMs - marginMs
}

export type SendGateResult<T> = { attempted: true; value: T } | { attempted: false; deferred: true }

/** Default awaitable delay; callers inject a fake for deterministic tests. */
function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Paces + budget-guards a cron run's sends. ONE instance is shared across
 * every send loop in a run (constructed from the run's own start time), so
 * the elapsed clock — and therefore the stop point — is global across the
 * whole run, not reset per loop. A deferred send is simply skipped this
 * pass: callers must NOT write any "sent" stamp for it, so the alert/
 * reminder stays eligible and the next cron run picks it up — self-healing,
 * never a lost or duplicate send.
 */
export type SendPacerOpts = {
  nowMs?: () => number
  sleep?: (ms: number) => Promise<void>
  paceMs?: number
  budgetMs?: number
  marginMs?: number
}

export class SendPacer {
  private startMs: number
  private opts: SendPacerOpts
  private sentCount = 0
  private deferredCount = 0

  constructor(startMs: number, opts: SendPacerOpts = {}) {
    this.startMs = startMs
    this.opts = opts
  }

  /**
   * Runs `attempt` (expected to be a full send, retries included) unless the
   * run is out of time budget, in which case it defers without calling
   * `attempt` at all. Paces every send after the first by `paceMs`.
   */
  async send<T>(attempt: () => Promise<T>): Promise<SendGateResult<T>> {
    const nowMs = this.opts.nowMs ?? Date.now
    const budgetMs = this.opts.budgetMs ?? CRON_TIME_BUDGET_MS
    const marginMs = this.opts.marginMs ?? CRON_TIME_SAFETY_MARGIN_MS

    if (shouldDeferSend(nowMs() - this.startMs, budgetMs, marginMs)) {
      this.deferredCount++
      return { attempted: false, deferred: true }
    }

    if (this.sentCount > 0) {
      const sleep = this.opts.sleep ?? defaultSleep
      await sleep(this.opts.paceMs ?? SEND_PACE_MS)
    }
    this.sentCount++
    const value = await attempt()
    return { attempted: true, value }
  }

  get deferredSends(): number {
    return this.deferredCount
  }
}
