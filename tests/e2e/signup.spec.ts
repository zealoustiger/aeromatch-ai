import { test, expect } from '@playwright/test'
import { TEST_EMAIL_DOMAIN } from './helpers/env'
import { findUserByEmail, deleteUserByEmail, runId } from './helpers/supabase'

// 2) The real magic-link signup form: submitting an email creates an account.
//    (Passwordless — signInWithOtp with shouldCreateUser creates the user the
//    moment the link is sent, which we confirm via the admin API instead of
//    opening an inbox.)
test('sign up via the magic-link form creates an account', async ({ page }) => {
  const email = `smoke-signup-${runId()}-${Math.floor(Math.random() * 1e6)}@${TEST_EMAIL_DOMAIN}`
  try {
    await page.goto('/auth')
    await page.fill('input[type="email"]', email)
    await page.click('button:has-text("Send magic link")')

    // The form resolves to either the success state or Supabase's hourly auth-email
    // quota. The quota is an infra limit (not a ClubHanger bug), so we skip rather
    // than fail when it's hit — the form is still proven wired.
    const outcome = page.getByText(/Check your email|rate limit exceeded/i)
    await expect(outcome).toBeVisible()
    const text = (await outcome.textContent()) || ''
    test.skip(/rate limit/i.test(text), 'Supabase auth-email hourly quota hit — re-run later; form verified, account check skipped')

    // Success path: confirmation shows, and the account now exists in auth.users.
    await expect(page.getByText('Check your email')).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()
    await expect.poll(() => findUserByEmail(email), { timeout: 15_000, message: 'account was not created' }).not.toBeNull()
  } finally {
    await deleteUserByEmail(email)
  }
})
