/**
 * Heuristic parser: turn a raw social/classifieds post into structured
 * partnership fields. Ported from scraper/scrape.py. Everything is best-effort —
 * the human confirms/edits in the review page before publishing.
 */

export interface ParsedListing {
  make: string
  model: string
  year: number | null
  home_airport: string | null
  city: string | null
  state: string | null
  share_type: string
  buy_in_price: number | null
  monthly_fixed: number | null
  hourly_wet: number | null
  contact_name: string | null
  title: string
}

const BAY_AREA_AIRPORTS = ['KHWD', 'KPAO', 'KSQL', 'KLVK', 'KRHV', 'KOAK', 'KNUQ', 'KSJC', 'KSFO', 'KCCR', 'KAPC']

const MAKES: Record<string, string[]> = {
  Cessna: ['172', '182', '152', '206', '210', '177', '180', 'skyhawk', 'skylane'],
  Piper: ['cherokee', 'archer', 'arrow', 'warrior', 'dakota', 'seneca', 'comanche', 'pa-28', 'pa28'],
  Beechcraft: ['bonanza', 'baron', 'debonair', 'sierra', 'musketeer'],
  Cirrus: ['sr20', 'sr22', 'sr22t', 'sr-20', 'sr-22'],
  Mooney: ['m20', 'ovation', 'acclaim', 'bravo'],
  Diamond: ['da40', 'da42', 'da20', 'da-40', 'da-42'],
  Grumman: ['aa5', 'aa-5', 'tiger', 'cheetah', 'traveler'],
  "Van's": ['rv-7', 'rv7', 'rv-8', 'rv8', 'rv-9', 'rv-10', 'rv-6', 'rv-14'],
}

export function detectAirport(text: string): string | null {
  const t = text.toUpperCase()
  for (const icao of BAY_AREA_AIRPORTS) {
    if (t.includes(icao)) return icao
    if (t.includes(icao.slice(1))) return icao // bare 3-letter (HWD)
  }
  return null
}

export function detectShareType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('1/4') || t.includes('quarter')) return '1/4'
  if (t.includes('1/3') || t.includes('third')) return '1/3'
  if (t.includes('1/2') || t.includes('half')) return '1/2'
  if (t.includes('leaseback')) return 'leaseback'
  if (t.includes('dry lease') || t.includes('dry-lease')) return 'dry_lease'
  return 'other'
}

export function extractPrice(text: string): {
  buy_in: number | null
  monthly: number | null
  hourly: number | null
} {
  const monthlyMatch = text.match(/\$(\d[\d,]+)\s*(?:\/mo|per month|\/month|a month)/i)
  const hourlyMatch = text.match(/\$(\d[\d,]+)\s*(?:\/hr|\/hour|per hour|an hour|wet)/i)
  const buyInMatch = text.match(/buy[- ]?in[^$]*\$(\d[\d,]+)/i)
  const num = (s: string | undefined) => (s ? parseInt(s.replace(/,/g, ''), 10) : null)

  let buy_in = num(buyInMatch?.[1])
  // Common shorthand in FB/classifieds posts: "price reduced to 40K", "$45k", "asking 38K"
  if (buy_in == null) {
    const kMatch = text.match(/(?:price|asking|share|reduced|sell|obo)[^$\d]{0,40}\$?(\d{1,3})\s*k\b/i)
    if (kMatch) buy_in = parseInt(kMatch[1], 10) * 1000
  }

  return {
    buy_in,
    monthly: num(monthlyMatch?.[1]),
    hourly: num(hourlyMatch?.[1]),
  }
}

export function extractAircraft(text: string): {
  make: string
  model: string
  year: number | null
} {
  const lower = text.toLowerCase()
  let make = 'Unknown'
  let model = 'Unknown'

  // Pass 1: explicit make name present ("Cessna 172", "Cirrus SR22")
  for (const [m, models] of Object.entries(MAKES)) {
    if (lower.includes(m.toLowerCase())) {
      make = m
      for (const mod of models) {
        if (lower.includes(mod)) {
          model = mod.toUpperCase()
          break
        }
      }
      break
    }
  }

  // Pass 2: no brand name — infer make from a model token ("182S", "SR22", "Cherokee").
  // Common in FB/classifieds posts that drop the manufacturer.
  if (make === 'Unknown') {
    for (const [m, models] of Object.entries(MAKES)) {
      for (const mod of models) {
        const isNumeric = /^\d+$/.test(mod)
        const re = isNumeric
          ? new RegExp(`\\b${mod}[a-z]?\\b`, 'i') // 182 → also matches "182S"
          : new RegExp(`\\b${mod.replace(/-/g, '-?')}\\b`, 'i')
        const match = text.match(re)
        if (match) {
          make = m
          model = match[0].toUpperCase()
          break
        }
      }
      if (make !== 'Unknown') break
    }
  }

  const yearMatch = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  return { make, model, year: yearMatch ? parseInt(yearMatch[1], 10) : null }
}

export function parseListing(rawText: string): ParsedListing {
  const text = rawText.trim()
  const { make, model, year } = extractAircraft(text)
  const { buy_in, monthly, hourly } = extractPrice(text)
  const airport = detectAirport(text)

  // Title: first non-empty line, trimmed to a sane length
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? text
  const title = firstLine.slice(0, 140)

  return {
    make,
    model,
    year,
    home_airport: airport,
    city: null,
    state: 'CA',
    share_type: detectShareType(text),
    buy_in_price: buy_in,
    monthly_fixed: monthly,
    hourly_wet: hourly,
    contact_name: null,
    title,
  }
}
