// ClubHanger Capture — Arc/Chrome (Manifest V3)
// Click the toolbar button on a Facebook post to grab its text + content
// photos and open the ClubHanger capture page with the payload.

const SITE = 'https://clubhanger.com'

// Runs IN the Facebook page (injected on click). Mirrors the old bookmarklet.
function extractPost() {
  // Prefer the opened post dialog; fall back to the article, then body.
  const root =
    document.querySelector('[role="dialog"] [role="article"]') ||
    document.querySelector('[role="article"]') ||
    document.body

  let text = (window.getSelection && String(window.getSelection())) || ''
  if (text.trim().length < 10) text = root.innerText || ''

  let imgs = Array.from(root.querySelectorAll('img'))
    .filter(
      (i) =>
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
