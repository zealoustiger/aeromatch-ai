import { test, expect } from '@playwright/test'
import { MARKER } from './helpers/env'
import { admin, deleteListingsByPoster, runId, testUser } from './helpers/supabase'

// 4) Post an aircraft-for-sale listing → verify the row (source='user', owned by
//    the test user) → delete.
test('post an aircraft listing, verify the row, then clean up', async ({ page }) => {
  const { id: posterId } = testUser()
  const title = `${MARKER(runId())} Aircraft ${Date.now()}`
  try {
    await page.goto('/aircraft/new')
    await page.selectOption('[name="make"]', 'Cessna')
    await page.fill('[name="model"]', '182T Skylane')
    await page.fill('[name="title"]', title)
    await page.fill('[name="asking_price"]', '285000')
    await page.fill('[name="state"]', 'TX')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/aircraft\?posted=/, { timeout: 20_000 })

    const { data, error } = await admin
      .from('aircraft_for_sale')
      .select('id, poster_id, source, status')
      .eq('title', title)
      .single()
    expect(error, error?.message).toBeNull()
    expect(data?.poster_id).toBe(posterId)
    expect(data?.source).toBe('user')
    expect(data?.status).toBe('active')
  } finally {
    await deleteListingsByPoster(posterId)
  }
})
