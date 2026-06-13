// ClubHanger Capture — Arc/Chrome (Manifest V3)
// Click the toolbar button on a Facebook post to grab its text + content
// photos and open the ClubHanger capture page with the payload.

const SITE = 'https://clubhanger.com'

// Runs IN the Facebook page (injected on click).
// Key insight: in FB's post dialog, the post body is NOT a [role=article] —
// only comments are. So we use the first comment as a boundary and read the
// post content from everything ABOVE it.
function extractPost() {
  const dialog = document.querySelector('[role="dialog"]') || document.body

  // The first [role=article] in the dialog is the first comment — our boundary.
  const firstComment = dialog.querySelector('[role="article"]')
  const beforeComments = (el) =>
    !firstComment ||
    !!(firstComment.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING)

  const clean = (s) => (s || '').replace(/ /g, ' ').trim()

  // 1) A deliberate text selection always wins.
  let text = clean(window.getSelection && String(window.getSelection()))

  // 2) Otherwise auto-detect the post body. Prefer FB's known message
  //    containers; else take the longest dir="auto" block above the comments.
  if (text.length < 15) {
    const messageEl =
      dialog.querySelector('[data-ad-comet-preview="message"]') ||
      dialog.querySelector('[data-ad-rendering-role="story_message"]') ||
      dialog.querySelector('[data-ad-preview="message"]')

    if (messageEl) {
      text = clean(messageEl.innerText)
    } else {
      let best = ''
      for (const b of dialog.querySelectorAll('div[dir="auto"]')) {
        if (!beforeComments(b)) continue
        const t = clean(b.innerText)
        if (t.length > best.length) best = t
      }
      text = best
    }
  }

  // 3) Images: large fbcdn images above the comments (skips avatars + comment
  //    attachments, which are either small or below the boundary).
  let imgs = Array.from(dialog.querySelectorAll('img'))
    .filter(
      (i) =>
        beforeComments(i) &&
        i.naturalWidth >= 350 &&
        i.naturalHeight >= 350 &&
        /scontent|fbcdn/.test(i.src)
    )
    .map((i) => i.src)
  imgs = imgs.filter((v, idx) => imgs.indexOf(v) === idx).slice(0, 10)

  return { text, imageUrls: imgs, postUrl: location.href }
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
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () =>
          alert(
            'ClubHanger: no post text or images found.\n\nOpen the post fully (click into it so the photos load), optionally select the text with your mouse, then click again.'
          ),
      })
      return
    }

    const url = `${SITE}/admin/capture#${encodeURIComponent(JSON.stringify(payload))}`
    chrome.tabs.create({ url })
  } catch (e) {
    console.error('ClubHanger capture failed', e)
  }
})
