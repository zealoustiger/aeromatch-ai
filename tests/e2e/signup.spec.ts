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

    // The form transitions to the "check your email" confirmation.
    await expect(page.getByText('Check your email')).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()

    // The account now exists in auth.users.
    await expect.poll(() => findUserByEmail(email), { timeout: 15_000, message: 'account was not created' }).not.toBeNull()
  } finally {
    await deleteUserByEmail(email)
  }
})
