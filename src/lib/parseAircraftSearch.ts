import { SEO_MAKES, SEO_MAKE_MODELS, STATE_NAMES } from '@/lib/seo'

/**
 * Heuristic natural-language → structured-filter parser for the aircraft search.
 *
 * Turns free text like "cirrus sr22 near khwd under 600k" into the canonical
 * /aircraft URL params (make / model_like / airport / state / price / year),
 * so the search box fills filters instead of doing one literal keyword match
 * (which matched nothing). Deterministic + instant + free — no per-search LLM.
 */
export type ParsedSearch = {
  make?: string
  model_like?: string // ilike prefix on `model` (families: sr22% catches SR22, SR22T, SR22-G6…)
  modelLabel?: string
  airport?: string // ICAO (e.g. KHWD) — resolved to state server-side
  state?: string // 2-letter
  min_price?: string
  max_price?: string
  min_year?: string
  max_year?: string
  min_tt?: string
  max_tt?: string
  q?: string // leftover unmatched words (kept as a keyword refinement)
  matched: boolean // true if any structured field was extracted
}

// "200k" / "1.2m" / "150000" / "$200,000" → integer USD
function money(tok: string): number | null {
  let m = (tok || '').toLowerCase().replace(/[$,\s]/g, '')
  const mult = m.endsWith('k') ? 1e3 : m.endsWith('m') ? 1e6 : 1
  m = m.replace(/[km]$/, '')
  const n = parseFloat(m)
  return Number.isFinite(n) ? Math.round(n * mult) : null
}

const STOP = new Set([
  'near', 'around', 'at', 'in', 'by', 'a', 'an', 'the', 'with', 'for', 'and', 'or', 'me',
  'plane', 'planes', 'aircraft', 'airplane', 'jet', 'jets', 'piston', 'single', 'twin',
  'for-sale', 'sale', 'buy', 'looking', 'want', 'show',
])

// Model slugs sorted longest-first so "sr22" wins over a shorter prefix.
const MODELS = [...SEO_MAKE_MODELS]
  .map((e) => ({ slug: e.modelSlug.replace(/-/g, ''), make: e.make, model: e.model }))
  .sort((a, b) => b.slug.length - a.slug.length)

export function parseAircraftSearch(input: string): ParsedSearch {
  const out: ParsedSearch = { matched: false }
  // Normalize: lowercase, drop hyphens inside tokens (sr-22 → sr22), pad + collapse.
  let s = ` ${(input || '').toLowerCase()} `.replace(/(\w)-(\w)/g, '$1$2').replace(/\s+/g, ' ')
  const hit = () => { out.matched = true }

  // 1) TOTAL TIME (before price, so "under 1000 hours" isn't read as a price).
  s = s.replace(/\b(?:under|below|less than|max|max)\s+([\d,]+)\s*(?:hours?|hrs?|tt|ttaf|total time)\b/g,
    (_m, n) => { const v = money(n); if (v) { out.max_tt = String(v); hit() } return ' ' })
  s = s.replace(/\b(?:over|above|more than|at least|min)\s+([\d,]+)\s*(?:hours?|hrs?|tt|ttaf|total time)\b/g,
    (_m, n) => { const v = money(n); if (v) { out.min_tt = String(v); hit() } return ' ' })

  // 2) PRICE — range first, then single bounds, then a bare "$200k" as a ceiling.
  s = s.replace(/\b(?:between|from)\s*\$?([\d.,]+\s*[km]?)\s*(?:to|and|-|–|—)\s*\$?([\d.,]+\s*[km]?)/g,
    (_m, a, b) => { const lo = money(a), hi = money(b); if (lo) out.min_price = String(lo); if (hi) out.max_price = String(hi); if (lo || hi) hit(); return ' ' })
  s = s.replace(/\b(?:under|below|less than|cheaper than|up to|max|budget)\s*\$?([\d.,]+\s*[km]?)/g,
    (_m, a) => { const v = money(a); if (v) { out.max_price = String(v); hit() } return ' ' })
  s = s.replace(/\b(?:over|above|more than|at least|min|minimum)\s*\$?([\d.,]+\s*[km]?)/g,
    (_m, a) => { const v = money(a); if (v) { out.min_price = String(v); hit() } return ' ' })
  s = s.replace(/\$([\d.,]+\s*[km]?)/g,
    (_m, a) => { const v = money(a); if (v) { out.max_price = out.max_price ?? String(v); hit() } return ' ' })

  // 3) YEAR — explicit phrasing only (bare 4-digit numbers stay, could be a model).
  s = s.replace(/\b(?:after|since|newer than|from)\s+(\d{4})\b/g, (_m, y) => { out.min_year = y; hit(); return ' ' })
  s = s.replace(/\b(\d{4})\s*(?:\+|or newer|and newer|or later)\b/g, (_m, y) => { out.min_year = y; hit(); return ' ' })
  s = s.replace(/\b(?:before|older than|up to)\s+(\d{4})\b/g, (_m, y) => { out.max_year = y; hit(); return ' ' })
  s = s.replace(/\b(\d{4})\s*(?:to|-|–)\s*(\d{4})\b/g, (_m, a, b) => { out.min_year = a; out.max_year = b; hit(); return ' ' })

  // 4) MODEL (infers make) — match a known model slug as a whole token.
  for (const mdl of MODELS) {
    const re = new RegExp(`\\b${mdl.slug}\\b`)
    if (re.test(s)) {
      out.model_like = mdl.slug
      out.modelLabel = mdl.model
      out.make = mdl.make
      s = s.replace(re, ' ').replace(/\s+/g, ' ')
      hit()
      break
    }
  }

  // 5) MAKE — explicit make token (only sets make if a model didn't already infer one).
  for (const mk of SEO_MAKES) {
    const re = new RegExp(`\\b${mk.name.toLowerCase().replace(/[^a-z0-9]/g, '')}\\b`)
    if (re.test(s.replace(/[^a-z0-9 ]/g, ''))) {
      if (!out.make) { out.make = mk.name; hit() }
      s = s.replace(new RegExp(`\\b${mk.name.toLowerCase()}\\b`), ' ').replace(/\s+/g, ' ')
      break
    }
  }

  // 6) AIRPORT — ICAO token (KHWD) after make/model are consumed, skipping common
  //    k-words ("king" as in King Air). Resolved to state by the /aircraft page.
  const AIRPORT_BLOCK = new Set(['king', 'kind', 'know', 'knew', 'keep', 'kept', 'knee', 'kits'])
  s = s.replace(/\bk[a-z]{3}\b/g, (m) => {
    if (AIRPORT_BLOCK.has(m) || out.airport) return m
    out.airport = m.toUpperCase(); hit(); return ' '
  })

  // 7) STATE — full state name (e.g. "california"). Only when no airport already set.
  if (!out.airport && !out.state) {
    for (const [code, name] of Object.entries(STATE_NAMES)) {
      const re = new RegExp(`\\b${name.toLowerCase()}\\b`)
      if (re.test(s)) { out.state = code; s = s.replace(re, ' ').replace(/\s+/g, ' '); hit(); break }
    }
  }

  // 8) LEFTOVER → keyword refinement (drop stop words).
  const leftover = s.trim().split(/\s+/).filter((w) => w && !STOP.has(w))
  if (leftover.length) out.q = leftover.join(' ')

  return out
}

/** Build the canonical /aircraft query string from a parsed result. */
export function parsedToParams(p: ParsedSearch): URLSearchParams {
  const params = new URLSearchParams()
  const set = (k: string, v?: string) => { if (v) params.set(k, v) }
  set('make', p.make)
  set('model_like', p.model_like)
  set('airport', p.airport)
  set('state', p.state)
  set('min_price', p.min_price)
  set('max_price', p.max_price)
  set('min_year', p.min_year)
  set('max_year', p.max_year)
  set('min_tt', p.min_tt)
  set('max_tt', p.max_tt)
  set('q', p.q)
  return params
}
