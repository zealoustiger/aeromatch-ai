import { test, expect } from '@playwright/test'
import { MARKER } from './helpers/env'
import { admin, deleteListingsByPoster, runId, testUser } from './helpers/supabase'

// 5) Post a seeker listing (pilot seeking a share) → verify the row → delete.
test('post a seeker listing, verify the row, then clean up', async ({ page }) => {
  const { id: posterId } = testUser()
  const title = `${MARKER(runId())} Seeker ${Date.now()}`
  try {
    await page.goto('/partnerships/seeking/new')
    await page.fill('[name="title"]', title)
    await page.fill('[name="home_airport"]', 'KAUS')
    await page.fill('[name="contact_email"]', 'smoke@clubhanger-e2e.test')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/partnerships\/seeking\/[0-9a-f-]{36}/, { timeout: 20_000 })

    const { data, error } = await admin
      .from('partnership_seekers')
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
