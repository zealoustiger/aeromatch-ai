// ClubHanger Capture — Arc/Chrome (Manifest V3)
// Click the toolbar button on a Facebook post to grab its text + content
// photos and open the ClubHanger capture page with the payload.

const SITE = 'https://clubhanger.com'

// Runs IN the Facebook page (injected on click). FB's DOM varies a lot by view
// and keeps several [role=dialog] nodes around (some empty), so we pick the
// content-bearing root and use multiple text fallbacks.
function extractPost() {
  const clean = (s) =>
    (s || '').replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').trim()
  const isBigImg = (i) =>
    i.naturalWidth >= 350 && i.naturalHeight >= 350 && /scontent|fbcdn/.test(i.src)

  // Choose the dialog with the most real content; fall back to most-text, then doc.
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'))
  let scope = null
  let bestImgs = -1
  for (const d of dialogs) {
    const n = Array.from(d.querySelectorAll('img')).filter(isBigImg).length
    if (n > bestImgs) {
      bestImgs = n
      scope = d
    }
  }
  if (!scope || bestImgs === 0) {
    let bestLen = 0
    for (const d of dialogs) {
      const len = (d.innerText || '').trim().length
      if (len > bestLen) {
        bestLen = len
        scope = d
      }
    }
  }
  if (!scope) scope = document.body

  const articles = Array.from(scope.querySelectorAll('[role="article"]'))
  const isComment = (a) => /^comment/i.test(a.getAttribute('aria-label') || '')
  const inComment = (el) => articles.some((a) => isComment(a) && a.contains(el))
  const postArticles = articles.filter((a) => !isComment(a))

  // ── TEXT ──
  let text = clean(window.getSelection && String(window.getSelection()))
  if (text.length < 15) {
    const msg =
      scope.querySelector('[data-ad-comet-preview="message"]') ||
      scope.querySelector('[data-ad-rendering-role="story_message"]') ||
      scope.querySelector('[data-ad-preview="message"]')
    if (msg) text = clean(msg.innerText)
  }
  if (text.length < 15 && postArticles.length) {
    text = postArticles.map((a) => clean(a.innerText)).sort((x, y) => y.length - x.length)[0] || ''
  }
  if (text.length < 15) {
    let best = ''
    for (const b of scope.querySelectorAll('div[dir="auto"]')) {
      if (inComment(b)) continue
      const t = clean(b.innerText)
      if (t.length > best.length) best = t
    }
    text = best
  }

  // ── AUTHOR ── the poster's name.
  // Primary: the dialog title reads "<Name>'s Post" — most reliable.
  // Fallback: first non-comment profile link that isn't the GROUP link
  // (group links contain /groups/; the poster header link does not).
  let author = ''
  const titleRe = /^(.{2,60}?)['‘’]s Post$/i
  for (const el of scope.querySelectorAll('h1, h2, h3, span, div')) {
    const m = clean(el.textContent).match(titleRe)
    if (m) {
      author = m[1].trim()
      break
    }
  }
  if (!author) {
    for (const a of scope.querySelectorAll('a[role="link"], h2 a, h3 a, strong a, a strong')) {
      if (inComment(a)) continue
      const href = a.getAttribute('href') || ''
      if (/\/groups\//.test(href)) continue // skip the group, we want the person
      const name = clean(a.textContent)
      if (name && name.length >= 2 && name.length <= 60 && /[a-z]/i.test(name) && !/^https?:/.test(name)) {
        author = name
        break
      }
    }
  }

  // ── IMAGES ── large fbcdn images, just not ones inside a comment
  let imgs = Array.from(scope.querySelectorAll('img'))
    .filter((i) => isBigImg(i) && !inComment(i))
    .map((i) => i.src)
  imgs = imgs.filter((v, idx) => imgs.indexOf(v) === idx).slice(0, 10)

  const docImgs = Array.from(document.querySelectorAll('img'))
  return {
    text,
    imageUrls: imgs,
    postUrl: location.href,
    author,
    _debug: {
      dialogs: dialogs.length,
      scopeIsDialog: scope !== document.body && scope !== document,
      articles: articles.length,
      comments: articles.filter(isComment).length,
      scopeImgs: Array.from(scope.querySelectorAll('img')).filter(isBigImg).length,
      docImgsTotal: docImgs.length,
      docImgsLarge: docImgs.filter(isBigImg).length,
    },
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return

  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPost,
    })
    const payload = res?.result

    if (!payload || (!payload.text.trim() && payload.imageUrls.length === 0)) {
      const d = payload && payload._debug
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (dbg) =>
          alert(
            'ClubHanger: nothing captured.\n\n' +
              (dbg
                ? `dialogs=${dbg.dialogs}, scopeIsDialog=${dbg.scopeIsDialog}, articles=${dbg.articles}, comments=${dbg.comments}, scopeImgs=${dbg.scopeImgs}, docImgs=${dbg.docImgsTotal} (large=${dbg.docImgsLarge})`
                : 'no data returned') +
              '\n\nTip: open the post via its date/timestamp (not by clicking the photo), select the text, then click again.'
          ),
        args: [d],
      })
      return
    }

    const url = `${SITE}/admin/capture#${encodeURIComponent(JSON.stringify(payload))}`
    chrome.tabs.create({ url })
  } catch (e) {
    console.error('ClubHanger capture failed', e)
  }
})
