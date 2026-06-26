import { test as setup } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { AUTH_DIR, TEST_EMAIL_DOMAIN } from './helpers/env'
import { ensureTestUser, sessionCookies, runId } from './helpers/supabase'

// Creates the per-run test user and writes an authenticated storageState the
// posting specs reuse — so they don't each redo a login. The signup spec does
// NOT use this; it must start logged out.
setup('authenticate', async ({ browser }) => {
  const email = `smoke-${runId()}@${TEST_EMAIL_DOMAIN}`
  const id = await ensureTestUser(email)
  const cookies = await sessionCookies(email)

  const ctx = await browser.newContext()
  await ctx.addCookies(cookies)
  await ctx.storageState({ path: `${AUTH_DIR}/state.json` })
  await ctx.close()

  writeFileSync(`${AUTH_DIR}/user.json`, JSON.stringify({ email, id }))
})
