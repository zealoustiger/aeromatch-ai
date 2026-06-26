import { mkdirSync, writeFileSync } from 'node:fs'
import { AUTH_DIR } from './helpers/env'
import { sweepLeftovers } from './helpers/supabase'

// Runs once before the suite: stamps a unique run id (used in every marker) and
// sweeps any artifacts a prior crashed run left on prod.
export default async function globalSetup() {
  mkdirSync(AUTH_DIR, { recursive: true })
  const runId = `${Date.now()}`
  writeFileSync(`${AUTH_DIR}/run.json`, JSON.stringify({ runId }))
  const swept = await sweepLeftovers()
  if (swept.rows || swept.users) {
    console.log(`[smoke] startup sweep removed ${swept.rows} stray rows + ${swept.users} stray users`)
  }
  console.log(`[smoke] run ${runId} → ${process.env.SMOKE_BASE_URL || 'https://clubhanger.com'}`)
}
