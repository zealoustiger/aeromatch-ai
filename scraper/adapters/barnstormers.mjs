/**
 * Barnstormers.com adapter — the largest GA classifieds, served as static HTML.
 *
 * Category pages live at /category-{id}-x.html and paginate with ?page=N.
 * Each listing is a <div class='classified_single' data-adid="ID"> block with a
 * .listing_header anchor to /classified-{id}-{slug}.html.
 */

import {
  fetchHtml,
  sleep,
  decode,
  stripTags,
  extractPrice,
  extractLocation,
  extractYear,
} from '../lib/ingest-core.mjs'

const BASE = 'https://www.barnstormers.com'

// Make/type categories worth aggregating. id is stable; slug is cosmetic.
const CATEGORIES = [
  { id: 17352, make: 'Cessna' },
  { id: 21147, make: 'Piper' },
  { id: 17627, make: 'Cirrus' },
  { id: 16738, make: 'Beechcraft' },
  { id: 18085, make: 'Diamond' },
  { id: 20590, make: 'Mooney' },
  { id: 19526, make: 'Grumman' },
  { id: 16973, make: 'Bellanca' },
  { id: 18671, make: 'Experimental' },
  { id: 16990, make: 'Biplane' },
  { id: 16400, make: 'Antique-Classic' },
  { id: 16268, make: 'Amphibian' },
  { id: 19185, make: 'Float Plane' },
]

const MODELS = {
  Cessna: ['150', '152', '170', '172', '175', '177', '180', '182', '185', '195', '206', '207', '210', '310', '337', '340', '414', '421'],
  Piper: ['Cherokee', 'Archer', 'Arrow', 'Warrior', 'Dakota', 'Saratoga', 'Seneca', 'Comanche', 'Malibu', 'Cub', 'Pacer', 'Aztec', 'Navajo', 'Lance', 'PA-28', 'PA-32', 'PA-46'],
  Cirrus: ['SR20', 'SR22', 'SR22T', 'SF50'],
  Beechcraft: ['Bonanza', 'Baron', 'Debonair', 'Sierra', 'Sundowner', 'Musketeer', 'Duchess', 'King Air', 'A36', 'V35', 'F33'],
  Diamond: ['DA20', 'DA40', 'DA42', 'DA62'],
  Mooney: ['M20', 'Ovation', 'Acclaim', 'Bravo', 'Eagle', 'Encore'],
  Grumman: ['AA1', 'AA5', 'Tiger', 'Cheetah', 'Traveler', 'Yankee'],
  Bellanca: ['Citabria', 'Decathlon', 'Viking', 'Scout'],
  Experimental: ['RV-3', 'RV-4', 'RV-6', 'RV-7', 'RV-8', 'RV-9', 'RV-10', 'RV-12', 'RV-14', 'Lancair', 'Glasair', 'Velocity', 'Kitfox', 'Sonex', 'Zenith'],
}

function extractModel(title, make) {
  for (const m of MODELS[make] || []) {
    if (title.toLowerCase().includes(m.toLowerCase())) return m
  }
  return null
}

function parseCategory(html, make) {
  const rows = []
  const parts = html.split(/data-adid=["'](\d+)["']/)
  for (let i = 1; i < parts.length; i += 2) {
    const sourceId = parts[i]
    const block = parts[i + 1] || ''

    const headerMatch = block.match(
      /class=["']listing_header["'][^>]*href=["']([^"']+)["'][^>]*>([^<]{3,200})<\/a>/
    )
    if (!headerMatch) continue
    const href = headerMatch[1]
    const title = decode(headerMatch[2])
    if (!title || title.length < 3) continue
    if (/\b(parts?|engine only|prop only|avionics only|wanted)\b/i.test(title)) continue

    const sourceUrl = href.startsWith('http')
      ? href
      : `${BASE}${href.startsWith('/') ? '' : '/'}${href}`

    const text = stripTags(block)
    let desc = text
    const titleIdx = desc.indexOf(title)
    if (titleIdx >= 0) desc = desc.slice(titleIdx + title.length)
    desc = desc.split(/·\s*Contact/i)[0]
    desc = desc.replace(/^[\s·•-]+/, '').trim()
    desc = desc.split(/Auction Dates:/i)[0].trim().slice(0, 1500)

    const { price, priceText } = extractPrice(text)
    const { location, state } = extractLocation(text)
    const year = extractYear(title, desc)
    const model = extractModel(title, make)

    rows.push({
      source_id: sourceId,
      source_url: sourceUrl,
      make: make === 'Experimental' || /[A-Z]/.test(make[0]) === false ? make : make,
      model,
      year,
      title,
      description: desc || null,
      asking_price: price ?? null,
      price_text: priceText ?? null,
      location: location ?? null,
      state: state ?? null,
    })
  }
  return rows
}

async function fetchCategoryPage(id, page) {
  const q = page > 1 ? `?page=${page}` : ''
  return fetchHtml(`${BASE}/category-${id}-x.html${q}`)
}

export const source = 'barnstormers'
export const label = 'Barnstormers'

export async function fetchListings({ pages = 2, log = console.log } = {}) {
  const all = []
  const seen = new Set()
  for (const cat of CATEGORIES) {
    let kept = 0
    for (let page = 1; page <= pages; page++) {
      try {
        const html = await fetchCategoryPage(cat.id, page)
        const rows = parseCategory(html, cat.make)
        if (rows.length === 0) break // no more pages
        for (const r of rows) {
          if (seen.has(r.source_id)) continue
          seen.add(r.source_id)
          // Normalize make field for canonical tagging.
          r.make = ['Experimental', 'Biplane', 'Antique-Classic', 'Amphibian', 'Float Plane'].includes(cat.make)
            ? r.make // keep the title-derived make if it's a type bucket
            : cat.make
          all.push(r)
          kept++
        }
      } catch (e) {
        log(`    ${cat.make} p${page} error: ${e.message}`)
        break
      }
      await sleep(1000)
    }
    log(`  ${cat.make.padEnd(16)} ${kept} listings`)
  }
  return all
}
