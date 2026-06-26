import { test, expect } from '@playwright/test'
import { MARKER } from './helpers/env'
import { admin, deleteListingsByPoster, runId, testUser } from './helpers/supabase'

// 3) Post a partnership → verify the row landed (owned by the test user) → delete.
test('post a partnership, verify the row, then clean up', async ({ page }) => {
  const { id: posterId } = testUser()
  const title = `${MARKER(runId())} Partnership ${Date.now()}`
  try {
    await page.goto('/partnerships/new')
    await page.selectOption('[name="make"]', 'Cessna')
    await page.fill('[name="model"]', '172S Skyhawk')
    await page.fill('[name="title"]', title)
    await page.fill('[name="home_airport"]', 'KAUS')
    await page.selectOption('[name="share_type"]', '1/3')
    await page.fill('[name="buy_in_price"]', '15000')
    await page.fill('[name="contact_email"]', 'smoke@clubhanger-e2e.test')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/partnerships\/[0-9a-f-]{36}/, { timeout: 20_000 })

    const { data, error } = await admin
      .from('partnerships')
      .select('id, poster_id, title, status')
      .eq('title', title)
      .single()
    expect(error, error?.message).toBeNull()
    expect(data?.poster_id).toBe(posterId)
    expect(data?.status).toBe('active')
  } finally {
    await deleteListingsByPoster(posterId)
  }
})
