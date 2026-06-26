import { test, expect } from '@playwright/test'

// 1) Landing on the homepage shows real, decoded listing photos (not just the
//    logo / broken placeholders).
test('homepage loads and shows real photos', async ({ page }) => {
  await page.goto('/')
  // Nudge lazy-loaded card images into view.
  await page.mouse.wheel(0, 1800)

  // Count <img> elements that actually decoded to a real size (excludes icons,
  // 1x1 tracking pixels, and broken images, which have naturalWidth 0).
  await expect
    .poll(
      () =>
        page.evaluate(
          () => Array.from(document.images).filter((im) => im.complete && im.naturalWidth > 64).length,
        ),
      { timeout: 15_000, message: 'expected several real photos to load on the homepage' },
    )
    .toBeGreaterThanOrEqual(3)
})
