// Serverless visual QA for the post-type-toggle cycle.
// Renders each auth-gated post page's PRERENDERED build HTML with the compiled
// CSS injected (no server — the live server gets SIGTERM'd in this sandbox, and
// the live routes auth-redirect anyway). Checks horizontal overflow at desktop
// 1280 + mobile 375, asserts the toggle is present/correct, saves screenshots.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const PAGES = [
  { slug: 'partnerships-new', html: '.next/server/app/partnerships/new.html', active: 'partnership' },
  { slug: 'seeking-new', html: '.next/server/app/partnerships/seeking/new.html', active: 'seeking' },
]
// Resolve the compiled CSS chunk from the prerendered HTML (hash changes per build).
function cssFor(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8')
  const href = (html.match(/\/_next\/(static\/chunks\/[^"]+\.css)/) || [])[1]
  return href ? readFileSync('.next/' + href, 'utf8') : ''
}
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
]
const OUT = 'nightshift/screenshots/post-type-toggle'

const browser = await chromium.launch()
let fail = 0
for (const pg of PAGES) {
  const CSS = cssFor(pg.html)
  let html = readFileSync(pg.html, 'utf8')
  // Drop script tags so no failed-chunk network noise; we want static render.
  html = html.replace(/<script[\s\S]*?<\/script>/g, '')
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    await page.setContent(html, { waitUntil: 'load' })
    await page.addStyleTag({ content: CSS })
    await page.waitForTimeout(150)

    const m = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      nav: !!document.querySelector('nav[aria-label="What do you want to post?"]'),
      current: document.querySelectorAll('[aria-current="page"]').length,
      tabs: Array.from(document.querySelectorAll('nav[aria-label="What do you want to post?"] a')).map((a) => ({
        text: a.textContent.trim(),
        href: a.getAttribute('href'),
        active: a.getAttribute('aria-current') === 'page',
      })),
    }))
    const overflow = m.scrollW > m.clientW + 1
    const ok = !overflow && m.nav && m.current === 1 && m.tabs.length === 2
    if (!ok) fail++
    console.log(
      `[${pg.slug} @ ${vp.name}] overflow=${overflow} (sw=${m.scrollW} cw=${m.clientW}) nav=${m.nav} aria-current=${m.current} tabs=${JSON.stringify(m.tabs)} => ${ok ? 'OK' : 'FAIL'}`
    )
    await page.screenshot({ path: `${OUT}/${pg.slug}-${vp.name}.png`, fullPage: false })
    await page.close()
  }
}
await browser.close()
console.log(fail === 0 ? 'QA-PASS' : `QA-FAIL (${fail})`)
process.exit(fail === 0 ? 0 : 1)
